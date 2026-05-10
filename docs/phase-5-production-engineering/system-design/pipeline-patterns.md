---
sidebar_position: 1
---

# Data Engineering Pipeline Patterns

The recurring patterns that show up in real production pipelines. Knowing these by name lets you communicate architecture decisions clearly and pick the right pattern for the job.

---

## 1. Full Load

Truncate the target table and reload everything from source on every run.

```
Source (full extract)
    → Truncate target
    → Load all rows
```

```python
# Spark — full load pattern
df = spark.read.jdbc(url, "source_table", properties=jdbc_props)

df.write.format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .saveAsTable("silver.orders")
```

**When to use:** Small dimension tables (under 1M rows), source doesn't support change tracking, data is cheap to re-read.

**When NOT to use:** Tables with millions of rows, slow source systems, tables that need history.

---

## 2. Incremental Load (Watermark)

Only read rows newer than the last successful run timestamp.

```
Source
    → WHERE updated_at > last_watermark
    → MERGE into target (upsert)
    → Save new watermark
```

```python
# Read watermark from control table
last_run = spark.sql("SELECT MAX(watermark_ts) FROM control.pipeline_log WHERE table_name='orders'") \
               .collect()[0][0]

# Incremental extract
df_new = spark.read.jdbc(
    url, "source_orders",
    properties={**jdbc_props, "fetchsize": "10000"},
    predicates=[f"updated_at > '{last_run}'"]
)

# Merge into Silver
df_new.createOrReplaceTempView("source_updates")
spark.sql("""
    MERGE INTO silver.orders AS t
    USING source_updates AS s ON t.order_id = s.order_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")

# Save new watermark
spark.sql(f"INSERT INTO control.pipeline_log VALUES ('orders', current_timestamp())")
```

**When to use:** Large tables, source has `updated_at` or CDC column, need near-real-time freshness.

---

## 3. CDC (Change Data Capture)

Capture INSERT / UPDATE / DELETE events at the database level — no polling, low latency.

```
Source DB (SQL Server / Oracle / Postgres)
    → CDC log reader (Debezium / ADF CDC / AWS DMS)
    → Event stream (Kafka / Event Hub)
    → Bronze (raw CDC events)
    → Silver (MERGE to apply changes)
```

```
CDC event schema:
{
  "op": "u",           -- i = insert, u = update, d = delete
  "before": { "order_id": 1, "status": "pending" },
  "after":  { "order_id": 1, "status": "shipped" },
  "ts_ms": 1705312200000
}
```

```python
# Apply CDC events in Spark Structured Streaming
from delta.tables import DeltaTable

def apply_cdc(batch_df, batch_id):
    # Separate inserts/updates from deletes
    upserts = batch_df.filter("op IN ('i', 'u')")
    deletes = batch_df.filter("op = 'd'")

    delta_table = DeltaTable.forName(spark, "silver.orders")

    # Apply upserts
    delta_table.alias("t").merge(
        upserts.alias("s"), "t.order_id = s.order_id"
    ).whenMatchedUpdateAll() \
     .whenNotMatchedInsertAll() \
     .execute()

    # Apply deletes (soft delete — set is_deleted flag)
    delta_table.alias("t").merge(
        deletes.alias("s"), "t.order_id = s.order_id"
    ).whenMatchedUpdate(set={"is_deleted": "true", "deleted_at": "current_timestamp()"}) \
     .execute()

stream = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "broker:9092") \
    .option("subscribe", "orders.cdc") \
    .load()

stream.writeStream.foreachBatch(apply_cdc).start()
```

**When to use:** Need low-latency sync (under 5 min), source has many deletes, high-volume tables where polling is too slow.

---

## 4. Medallion (Bronze → Silver → Gold)

Multi-layer lakehouse architecture. Each layer has a clear contract.

```
Source Systems
    ↓ Raw ingest (no transformation)
Bronze — exact copy, append-only, partitioned by ingest date
    ↓ Clean, type, validate, deduplicate
Silver — conformed, typed, Delta, SCD2 for dimensions
    ↓ Aggregate, join, model for use case
Gold — star schema / wide tables / aggregates for BI
    ↓
Reporting (Power BI / Tableau / Databricks SQL)
```

| Layer | Format | Transformations | Retention |
|-------|--------|-----------------|-----------|
| Bronze | Parquet / Delta | None — raw | 2 years |
| Silver | Delta | Typed, cleaned, deduped, SCD2 | 3 years |
| Gold | Delta | Aggregated, star schema | 5 years |

**Key rule:** Never skip layers. If Gold is wrong, you can reprocess from Silver without re-ingesting from source.

---

## 5. Lambda Architecture

Serve both low-latency streaming results and accurate batch results from the same query layer.

```
Source Events
    ├── Speed Layer (Streaming)
    │       → Kafka → Spark Streaming → serving layer
    │       → Fast but approximate / incomplete
    │
    └── Batch Layer (Full recompute)
            → Daily Spark job → complete + accurate
            → Overwrites speed layer results

Query Layer merges both → users see fast + accurate data
```

**Problem:** Two codebases doing the same logic (one stream, one batch). Maintenance burden is high.

**When to use:** Need under 1 min latency AND guaranteed accuracy. Use only if Kappa doesn't work.

---

## 6. Kappa Architecture

Use only streaming — batch is just streaming with replay.

```
Source Events → Kafka (long retention: 30-90 days)
    → Spark Structured Streaming (micro-batch every 5 min)
    → Delta Lake (idempotent writes via MERGE)

To reprocess: replay from Kafka offset 0
```

**Why it works:** Delta Lake + MERGE makes streaming writes idempotent. Replaying events produces the same result as batch reprocessing.

**When to use:** Modern default. Simplifies architecture — one pipeline serves both real-time and historical views.

---

## 7. Fan-Out (One Source → Many Targets)

One ingestion pipeline writes to multiple consumers.

```
Source (e.g. Kafka topic: orders)
    ├── → Bronze Delta (raw storage)
    ├── → Silver streaming table (real-time dashboard)
    ├── → Elasticsearch (search index)
    └── → Notification service (large orders alert)
```

**Implementation:** Multiple Kafka consumer groups — each reads the same topic independently. Or use Spark `writeStream` with multiple sinks.

---

## 8. Dead Letter Queue (DLQ) Pattern

Isolate bad records so they don't block the pipeline.

```python
def process_batch(batch_df, batch_id):
    valid = batch_df.filter("amount IS NOT NULL AND amount > 0")
    invalid = batch_df.filter("amount IS NULL OR amount <= 0")

    # Process valid records normally
    valid.write.format("delta").mode("append").saveAsTable("silver.orders")

    # Write bad records to DLQ for investigation
    invalid.withColumn("error_reason", lit("invalid_amount")) \
           .withColumn("failed_at", current_timestamp()) \
           .write.format("delta").mode("append").saveAsTable("dlq.orders_failed")
```

**Rule:** A DLQ should always be queryable. Ops team investigates, fixes data, and replays from DLQ.

---

## Choosing a Pattern

| Scenario | Pattern |
|----------|---------|
| Small reference table, full extract is fine | Full Load |
| Large table, source has `updated_at` | Incremental + Watermark |
| Need deletes and sub-5-min latency | CDC |
| Enterprise data lake from scratch | Medallion |
| Need real-time + historical accuracy | Kappa (default) or Lambda |
| Multiple downstream consumers of same data | Fan-Out |
| Messy source data with bad records | DLQ + validation layer |
