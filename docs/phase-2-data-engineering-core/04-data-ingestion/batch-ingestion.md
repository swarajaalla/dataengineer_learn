---
sidebar_position: 4
---

# Batch Ingestion

Batch ingestion moves a bounded dataset on a schedule. It's the most common ingestion pattern in enterprise data engineering — most data doesn't need to be real-time.

---

## What It Is

A pipeline runs at a fixed schedule (hourly, daily, weekly), reads data from a source, writes it to the landing zone, then stops.

```
Schedule: Every day at 1 AM
  → Extract records from SAP where modified_date = yesterday
  → Write to ADLS Bronze
  → Done until tomorrow
```

---

## When to Use Batch

- Daily business reports that refresh overnight
- ERP exports (SAP, Dynamics) that are generated at end-of-day
- File-based sources (SFTP, shared drive drops)
- Data that changes infrequently (weekly product catalog)
- Any use case where 15-minute latency is acceptable

**Streaming is overkill when:** Data analysts check dashboards once a day. You don't need real-time if no one is watching in real-time.

---

## Watermark-Based Incremental Batch

The most important pattern in batch ingestion. Track what was last loaded, extract only what's new.

**Control table in Azure SQL:**
```sql
CREATE TABLE pipeline_watermarks (
    pipeline_name       VARCHAR(100) PRIMARY KEY,
    source_table        VARCHAR(200),
    watermark_column    VARCHAR(100),
    last_watermark      DATETIME2,
    last_run_status     VARCHAR(20),
    last_run_datetime   DATETIME2
);

-- Initial row
INSERT INTO pipeline_watermarks VALUES (
    'sap_sales_orders', 'SAP_ORDERS', 'LAST_CHANGED_DATETIME',
    '1900-01-01 00:00:00', 'SUCCESS', GETDATE()
);
```

**ADF pipeline logic:**
```
Step 1: Lookup Activity
  → Query: SELECT last_watermark FROM pipeline_watermarks 
           WHERE pipeline_name = @pipeline_name
  → Returns: 2024-01-14 23:59:59

Step 2: Copy Activity
  → Source SQL query: 
    SELECT * FROM SAP_ORDERS 
    WHERE LAST_CHANGED_DATETIME > '@{activity('Lookup1').output.firstRow.last_watermark}'
      AND LAST_CHANGED_DATETIME <= '@{utcnow()}'
  → Sink: ADLS Bronze Parquet
    Path: /bronze/sap/sales_orders/year=@{formatDateTime(utcnow(),'yyyy')}/
          month=@{formatDateTime(utcnow(),'MM')}/

Step 3: Stored Procedure Activity (on success)
  → UPDATE pipeline_watermarks
    SET last_watermark = '@{utcnow()}',
        last_run_status = 'SUCCESS',
        last_run_datetime = GETDATE()
    WHERE pipeline_name = '@{pipeline().parameters.pipeline_name}'
```

---

## Partition Strategy for Batch Output

Partition output by the natural date of the data, not the run date:

```
/bronze/sap/sales_orders/
  year=2024/month=01/day=14/
    part-00000.parquet   ← data for Jan 14
  year=2024/month=01/day=15/
    part-00000.parquet   ← data for Jan 15
```

**Why:** If you reprocess Jan 14's data, it overwrites the `day=14` partition — not mixed in with other days. Downstream jobs that process `day=14` don't re-read unrelated data.

---

## Idempotency: The Requirement for Re-Runnable Pipelines

A batch pipeline MUST be safe to re-run. If it fails and you run it again:
- It should not create duplicate data
- It should not skip data
- It should produce the same result

**Making pipelines idempotent:**

```python
# BAD — append mode creates duplicates on re-run
df.write.mode("append").parquet("/bronze/sales/")

# GOOD — overwrite partition on re-run (safe for re-processing)
df.write \
    .mode("overwrite") \
    .option("partitionOverwriteMode", "dynamic") \
    .partitionBy("year", "month", "day") \
    .parquet("/bronze/sales/")
# Only overwrites the partitions present in df — other partitions untouched
```

For Silver/Gold Delta tables, use MERGE:
```sql
MERGE INTO silver.sales_orders AS target
USING new_records AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

---

## Batch Window Design

| Window | Best for | Latency | Complexity |
|--------|----------|---------|-----------|
| **Daily (overnight)** | Most enterprise reporting | 8–24 hours | Low |
| **Hourly** | Near-real-time dashboards | 1–2 hours | Medium |
| **15-minute** | Operational monitoring | 15–30 min | Medium |
| **Event-triggered** | File arrivals, CDC batches | < 5 minutes | Medium |

Daily is the most common. Move to hourly only if business explicitly requires it.

---

## Handling Late-Arriving Data

Source systems sometimes send corrections for past dates (amended invoices, late file drops).

```python
# Late data from Jan 10 arrives on Jan 15
# Use dynamic partition overwrite — it will overwrite Jan 10's partition
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")

df_late.write \
    .mode("overwrite") \
    .partitionBy("year", "month", "day") \
    .save("/bronze/invoices/")
# Overwrites year=2024/month=01/day=10/ with corrected data
# Doesn't touch Jan 11–15
```

Then trigger reprocessing of the affected downstream Silver/Gold partitions.

---

## Real ADF Pipeline: Parameterized Multi-Table Batch

```json
// Metadata table drives everything
{
  "source_name": "sap_sales_orders",
  "source_query": "SELECT * FROM ORDERS WHERE CHANGED_ON > '@lastWatermark'",
  "target_container": "bronze",
  "target_path": "sap/sales_orders",
  "partition_column": "DOCUMENT_DATE",
  "watermark_column": "CHANGED_ON"
}

// One generic ADF pipeline:
// 1. ForEach → iterates metadata table rows
// 2. Inside: Lookup (get watermark) → Copy Activity (parameterized) → SP (update watermark)
// One pipeline handles 50+ tables
```
