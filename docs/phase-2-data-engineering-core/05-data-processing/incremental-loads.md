---
sidebar_position: 4
---

# Incremental Loads

Processing only new and changed data instead of reprocessing everything from scratch every time. Essential for large datasets where full reprocessing would be too slow or expensive.

---

## Full Load vs Incremental Load

| | Full Load | Incremental |
|--|-----------|------------|
| **What it processes** | All data, every time | Only new/changed records |
| **When to use** | Small tables, no delta mechanism | Large tables, has watermark or CDC |
| **Cost** | High (reads 100M rows for 10K changes) | Low (reads only 10K changes) |
| **Complexity** | Simple | Medium |
| **Failure recovery** | Just re-run | More careful — idempotency required |

---

## Pattern 1: Watermark-Based Incremental (Silver layer)

Read new Bronze records, merge them into Silver.

```python
from delta.tables import DeltaTable
from pyspark.sql.functions import col, max as spark_max

# Get last processed watermark from Silver table metadata or a control table
watermark_df = spark.sql("""
    SELECT COALESCE(MAX(ingestion_ts), '1900-01-01') AS last_watermark
    FROM silver.orders
""")
last_watermark = watermark_df.collect()[0]["last_watermark"]

# Read only Bronze records newer than last watermark
new_records = spark.read.format("delta") \
    .load("/bronze/orders/") \
    .filter(col("ingestion_ts") > last_watermark)

print(f"Processing {new_records.count()} new records since {last_watermark}")

# Merge into Silver
silver_table = DeltaTable.forPath(spark, "/silver/orders/")
silver_table.alias("target").merge(
    new_records.alias("source"),
    "target.order_id = source.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()
```

---

## Pattern 2: Partition-Based Incremental

Only reprocess today's partition. Works when data is partitioned by date and you only care about today's data.

```python
from datetime import date, timedelta

# Only process yesterday's partition (nightly job)
process_date = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

bronze_df = spark.read.format("delta") \
    .load("/bronze/events/") \
    .filter(col("event_date") == process_date)

# Write to Silver — overwrite only this date's partition
bronze_df.write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", f"event_date = '{process_date}'") \
    .save("/silver/events/")
```

`replaceWhere` is the key — it replaces only the matching partition, leaving all other dates untouched.

---

## Pattern 3: Delta MERGE (Upsert)

The most robust incremental pattern. Handle inserts and updates in one atomic operation.

```python
from delta.tables import DeltaTable

# New/changed records from CDC or watermark-based Bronze extract
source_df = spark.read.format("delta") \
    .load("/bronze/customers/") \
    .filter(col("extraction_date") == current_date_str)

# MERGE into Silver customer table
silver = DeltaTable.forPath(spark, "/silver/customers/")
silver.alias("tgt").merge(
    source_df.alias("src"),
    "tgt.customer_id = src.customer_id"
).whenMatchedUpdate(
    condition="tgt.updated_at < src.updated_at",  # only update if source is newer
    set={
        "customer_name": "src.customer_name",
        "email": "src.email",
        "region": "src.region",
        "updated_at": "src.updated_at"
    }
).whenNotMatchedInsertAll() \
 .execute()
```

---

## Idempotency: Re-Run Without Fear

Incremental pipelines MUST be safe to run twice. If it fails and you re-run it:
- MERGE handles duplicates automatically (matched → update, not insert)
- `replaceWhere` overwrites the partition cleanly
- Never use `INSERT` for incremental — always `MERGE` or partition overwrite

```python
# BAD — append creates duplicates on re-run
df.write.format("delta").mode("append").save("/silver/orders/")

# GOOD — MERGE is idempotent
silver_table.alias("target").merge(
    source.alias("source"),
    "target.order_id = source.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()
```

---

## Handling Late-Arriving Data

Data from 3 days ago that arrives today because of a delayed source system or corrected records.

```python
# Config: how far back do we accept late data?
LATE_ARRIVAL_DAYS = 7

from datetime import datetime, timedelta
cutoff = (datetime.now() - timedelta(days=LATE_ARRIVAL_DAYS)).strftime("%Y-%m-%d")

# Bronze extract: all records in the late arrival window
late_records = spark.read.format("delta") \
    .load("/bronze/orders/") \
    .filter(col("order_date") >= cutoff)  # last 7 days of data

# MERGE handles it correctly — late arrivals update existing or insert new
silver.alias("tgt").merge(
    late_records.alias("src"),
    "tgt.order_id = src.order_id"
).whenMatchedUpdate(
    condition="tgt.updated_at < src.updated_at"
    # ... update fields
).whenNotMatchedInsertAll() \
 .execute()
```

---

## Auto Loader: Incremental File Processing

For file-based sources, Auto Loader tracks which files were processed so you never reprocess:

```python
df_stream = spark.readStream \
    .format("cloudFiles") \
    .option("cloudFiles.format", "parquet") \
    .option("cloudFiles.schemaLocation", "/schemas/orders") \
    .load("/bronze/sap/orders/")

# Each new file that lands in the folder gets processed exactly once
df_stream.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/silver/orders") \
    .option("mergeSchema", "true") \
    .outputMode("append") \
    .start("/silver/orders/")
```

Auto Loader + Delta is the easiest incremental pattern for file-based sources.

---

## Slowly Changing Dimensions: Incremental History

Incremental handling of dimensions that change over time (customers move, products get recategorized).

See the [SCD page](../06-data-modeling/slowly-changing-dimensions) for full implementation. In short:

```python
# SCD Type 2: detect changed records, expire old row, insert new row
changed_records = source.join(silver_dim, on="customer_id", how="left") \
    .filter(
        (source.region != silver_dim.region) |  # region changed
        silver_dim.customer_id.isNull()          # new customer
    )
```
