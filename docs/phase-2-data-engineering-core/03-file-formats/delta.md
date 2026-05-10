---
sidebar_position: 6
---

# Delta Format

Delta Lake is an open-source storage format that adds ACID transactions, schema enforcement, time travel, and DML support on top of Parquet files stored in object storage.

---

## What It Is

Delta = Parquet data files + `_delta_log/` transaction log

```
/silver/orders/
  ├── _delta_log/
  │   ├── 00000000000000000000.json   ← commit 0: ADD 5 Parquet files
  │   ├── 00000000000000000001.json   ← commit 1: ADD 3 more files
  │   ├── 00000000000000000002.json   ← commit 2: REMOVE 2 files (after OPTIMIZE)
  │   └── 00000000000000000010.checkpoint.parquet  ← snapshot at commit 10
  ├── part-00000-a1b2c3.snappy.parquet
  ├── part-00001-d4e5f6.snappy.parquet
  └── part-00002-g7h8i9.snappy.parquet
```

The log is what makes Delta different from plain Parquet. It records what happened in every commit.

---

## What Each Log Entry Contains

```json
// 00000000000000000001.json
{
  "commitInfo": {
    "timestamp": 1705312800000,
    "operation": "WRITE",
    "operationParameters": {"mode": "Append", "partitionBy": "[\"year\",\"month\"]"}
  },
  "add": {
    "path": "year=2024/month=01/part-00000.snappy.parquet",
    "size": 15728640,
    "stats": "{\"numRecords\":125000,\"minValues\":{\"order_id\":\"ORD-00001\"},\"maxValues\":{\"order_id\":\"ORD-125000\"}}"
  }
}
```

The stats in each log entry enable **data skipping** — Spark reads the log to find which files might contain the data you need before reading any Parquet.

---

## Features Unlocked by the Transaction Log

**ACID transactions:** A write either fully commits (log entry written) or doesn't. No partial state.

**Time travel:** Every version of the table is preserved in the log. You can query any historical state.
```sql
-- What did the table look like 7 days ago?
SELECT * FROM silver.orders TIMESTAMP AS OF date_sub(current_date(), 7);

-- Or by version number
SELECT * FROM silver.orders VERSION AS OF 15;
```

**MERGE (upsert):**
```sql
MERGE INTO silver.customers AS target
USING new_customers AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

**Schema evolution:**
```python
df.write.format("delta") \
    .option("mergeSchema", "true") \  # allow adding new columns
    .mode("append") \
    .save("/silver/orders/")
```

**Schema enforcement:** If you try to write a DataFrame with wrong column types, Delta rejects it. Plain Parquet silently appends corrupt data.

---

## Delta vs Plain Parquet

| Property | Parquet | Delta |
|----------|---------|-------|
| **ACID** | No | Yes |
| **UPDATE / DELETE** | No | Yes |
| **MERGE** | No | Yes |
| **Time travel** | No | Yes |
| **Schema enforcement** | No | Yes |
| **Schema evolution** | Manual file manipulation | Supported |
| **Concurrent writes** | Unsafe | Supported (optimistic concurrency) |
| **Small file compaction** | Manual | `OPTIMIZE` command |
| **Streaming + batch** | Separate | Unified |
| **Storage overhead** | None | Tiny (log files are small) |

---

## Delta Table Types: Managed vs External

**Managed (Unity Catalog):**
```sql
CREATE TABLE catalog.schema.orders
USING DELTA
AS SELECT * FROM ...;
-- Location: managed by Unity Catalog, in the catalog storage root
-- DROP TABLE removes data + metadata
```

**External:**
```sql
CREATE TABLE catalog.schema.orders
USING DELTA
LOCATION 'abfss://silver@account.dfs.core.windows.net/orders/'
-- Location: you control the path
-- DROP TABLE removes metadata only, data stays in ADLS
```

For production: use external tables on ADLS. Data isn't accidentally deleted if someone drops the table.

---

## OPTIMIZE and VACUUM

**OPTIMIZE** — compact small files into larger ones:
```sql
OPTIMIZE silver.orders;
-- Compacts small files into 1 GB files
-- Greatly improves read performance for data accumulated via streaming

OPTIMIZE silver.orders ZORDER BY (customer_id, order_date);
-- Co-locates related rows → faster filters on customer_id and order_date
```

**VACUUM** — delete old Parquet files no longer referenced by the log:
```sql
VACUUM silver.orders RETAIN 168 HOURS;  -- keep 7 days of history (for time travel)
-- Default retention: 7 days — don't go below this
```

Without VACUUM, old files accumulate forever and storage costs grow.

---

## When to Upgrade from Parquet to Delta

Signs your Parquet table needs Delta:
- You're doing incremental loads and overwriting individual partitions manually
- You need UPDATE or DELETE (e.g., GDPR right-to-be-forgotten)
- Multiple jobs write to the same table concurrently
- You want to query historical data without maintaining separate archives
- Schema changes are causing pipeline failures

Upgrading is one command:
```python
from delta.tables import DeltaTable
DeltaTable.convertToDelta(spark, "parquet.`/silver/orders/`", "year INT, month INT")
```
