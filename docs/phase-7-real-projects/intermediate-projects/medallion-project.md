---
sidebar_position: 1
---

# Project: Full Medallion Lakehouse

Build a complete Bronze → Silver → Gold lakehouse with Delta Lake, data quality checks, and a star schema Gold layer.

---

## What You'll Build

```
CSV / API source (NYC Taxi data or similar)
        ↓ ADF Copy Activity
ADLS Bronze (raw Parquet, partitioned by date)
        ↓ Databricks: bronze_to_silver.py
ADLS Silver (Delta, cleaned, typed, SCD2 for dimensions)
        ↓ Data Quality checks (row count, null rate, value ranges)
        ↓ Databricks: silver_to_gold.py
Gold — fact_trips + dim_location + dim_date (star schema)
        ↓ Databricks SQL
Dashboard or analysis notebook
```

---

## Recommended Dataset

**NYC Yellow Taxi Trip Data** — available publicly on the NYC Open Data portal.

- ~200MB per month CSV
- Has timestamps, pick-up/drop-off location IDs, fares, passenger counts
- Real-world messy data (nulls, outliers, data type issues)

---

## Key Deliverables

### Bronze Layer
- Raw Parquet files partitioned by `pickup_year` and `pickup_month`
- Metadata columns: `_ingest_ts`, `_source_file`, `_ingest_date`
- No transformation — exact copy of source

### Silver Layer

```python
from pyspark.sql.functions import col, to_timestamp, unix_timestamp

df_bronze = spark.read.format("delta").load("/mnt/bronze/taxi_trips/")

df_silver = df_bronze \
    .filter(col("passenger_count") > 0) \
    .filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0) \
    .filter(col("fare_amount") < 500) \
    .withColumn("pickup_datetime", to_timestamp(col("tpep_pickup_datetime"))) \
    .withColumn("dropoff_datetime", to_timestamp(col("tpep_dropoff_datetime"))) \
    .withColumn("trip_duration_min",
        (unix_timestamp(col("dropoff_datetime")) - unix_timestamp(col("pickup_datetime"))) / 60
    ) \
    .filter(col("trip_duration_min").between(1, 180)) \
    .select("trip_id", "vendor_id", "pickup_datetime", "dropoff_datetime",
            "pickup_location_id", "dropoff_location_id",
            "passenger_count", "trip_distance", "fare_amount", "tip_amount",
            "trip_duration_min")
```

### Gold Star Schema

```sql
-- Dimension: Location
CREATE TABLE gold.dim_location AS
SELECT
    location_id,
    borough,
    zone,
    service_zone
FROM silver.taxi_zones;

-- Fact: Trips
CREATE TABLE gold.fact_trips AS
SELECT
    t.trip_id,
    l_pu.location_id AS pickup_location_key,
    l_do.location_id AS dropoff_location_key,
    d.date_key,
    t.passenger_count,
    t.trip_distance,
    t.fare_amount,
    t.tip_amount,
    t.trip_duration_min
FROM silver.taxi_trips t
JOIN gold.dim_location l_pu ON t.pickup_location_id = l_pu.location_id
JOIN gold.dim_location l_do ON t.dropoff_location_id = l_do.location_id
JOIN gold.dim_date d ON DATE(t.pickup_datetime) = d.date_value;
```

---

## Things to Handle (Makes It Real)

1. **Schema changes** — add `mergeSchema=true` to Silver write
2. **Duplicate trips** — some trip IDs appear twice (dedup in Silver)
3. **NULL location IDs** — decide: drop or keep with "Unknown" dimension
4. **Outlier fares** — fare_amount of $9999 is clearly wrong (validate in DQ checks)
5. **Backfill** — process January–December 2023 using a loop or ADF ForEach

---

## Portfolio Value

Show:
- The architecture diagram
- Why you chose the Silver validation rules
- How the star schema enables fast Power BI queries (fewer joins = faster reports)
- Row counts at each layer (shows you validated the pipeline)
