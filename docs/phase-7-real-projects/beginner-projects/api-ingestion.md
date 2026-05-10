---
sidebar_position: 1
---

# Project: API to Delta Lake Pipeline

Build a complete pipeline that ingests data from a public REST API, stores it in ADLS, and transforms it using Databricks.

---

## What You'll Build

```
REST API (public weather or finance data)
        ↓ Python script / ADF Web Activity
ADLS Bronze (raw JSON, partitioned by date)
        ↓ Databricks Notebook
ADLS Silver (Delta, cleaned + typed)
        ↓ Databricks SQL
Gold Table (daily aggregation)
```

---

## Suggested APIs (Free)

| API | Data | Auth |
|-----|------|------|
| Open-Meteo | Weather data | None — truly free |
| CoinGecko | Crypto prices | None (rate limited) |
| REST Countries | Country data | None |
| JSONPlaceholder | Mock data | None (for testing) |

---

## Step 1: Fetch and Store in Bronze

```python
import requests
import json
from datetime import date
from pyspark.sql.functions import current_timestamp, lit, current_date

# Fetch data
url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": 51.5,
    "longitude": -0.1,
    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
    "timezone": "Europe/London",
    "past_days": 7
}
response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

# Convert to DataFrame
df = spark.createDataFrame([data])

# Add metadata
df_bronze = df \
    .withColumn("_ingest_ts", current_timestamp()) \
    .withColumn("_ingest_date", current_date()) \
    .withColumn("_source", lit("open_meteo_api"))

# Write to Bronze
df_bronze.write.format("delta") \
    .mode("append") \
    .partitionBy("_ingest_date") \
    .save("abfss://bronze@mystorageaccount.dfs.core.windows.net/weather/")
```

---

## Step 2: Transform to Silver

```python
from pyspark.sql.functions import explode, arrays_zip, col, to_date

df_raw = spark.read.format("delta") \
    .load("abfss://bronze@mystorageaccount.dfs.core.windows.net/weather/")

# Explode arrays to get one row per day
df_exploded = df_raw.select(
    explode(arrays_zip("daily.time", "daily.temperature_2m_max", "daily.temperature_2m_min"))
    .alias("daily_data")
).select(
    to_date(col("daily_data.time")).alias("date"),
    col("daily_data.temperature_2m_max").alias("temp_max"),
    col("daily_data.temperature_2m_min").alias("temp_min"),
)

df_exploded.write.format("delta") \
    .mode("overwrite") \
    .saveAsTable("silver.weather_daily")
```

---

## Step 3: Gold Aggregation

```sql
CREATE OR REPLACE TABLE gold.monthly_weather AS
SELECT
    DATE_TRUNC('month', date) AS month,
    ROUND(AVG(temp_max), 1) AS avg_max_temp,
    ROUND(AVG(temp_min), 1) AS avg_min_temp,
    ROUND(MAX(temp_max), 1) AS record_high,
    ROUND(MIN(temp_min), 1) AS record_low
FROM silver.weather_daily
GROUP BY 1;
```

---

## What to Document

In your README:
- Why you chose this API
- Architecture diagram (simple ASCII is fine)
- How you'd handle an API rate limit or downtime
- How you'd add a second data source
