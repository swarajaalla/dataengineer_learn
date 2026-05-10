---
sidebar_position: 4
---

# Parquet

Parquet is the standard columnar file format for analytical workloads. If you're storing data in a lake for querying, use Parquet (or Delta, which is Parquet under the hood).

---

## What It Is

Parquet is an open-source, binary, columnar storage format. It stores data column-by-column instead of row-by-row.

**Row-oriented (CSV):**
```
Row 1: [ORD-001, C-100, 2024-01-15, Berlin, 99.99]
Row 2: [ORD-002, C-101, 2024-01-16, Munich, 149.99]
Row 3: [ORD-003, C-100, 2024-01-16, Berlin, 29.99]
```

**Columnar (Parquet):**
```
order_id column:   [ORD-001, ORD-002, ORD-003]
customer_id column:[C-100,   C-101,   C-100]
date column:       [2024-01-15, 2024-01-16, 2024-01-16]
city column:       [Berlin, Munich, Berlin]
revenue column:    [99.99, 149.99, 29.99]
```

**Why it matters:** A query that only needs `revenue` reads only the revenue column. CSV reads all columns to find the ones you want.

---

## How Columnar Storage Speeds Up Analytics

```sql
SELECT city, SUM(revenue)
FROM sales
WHERE city = 'Berlin'
GROUP BY city
```

- **CSV:** Read 5 columns × 1B rows = 5B values to process
- **Parquet:** Read only `city` and `revenue` columns = 2B values — then apply predicate filter using column statistics

Real impact: a query that takes 10 minutes on CSV takes 30 seconds on Parquet.

---

## Parquet Internals

```
Parquet File
  ├── File Metadata (footer — schema, row group stats)
  ├── Row Group 1 (default: 128MB)
  │   ├── Column Chunk: order_id → [data pages] + statistics (min/max)
  │   ├── Column Chunk: customer_id → [data pages] + statistics
  │   └── Column Chunk: revenue → [data pages] + statistics (min/max)
  ├── Row Group 2
  └── ...
```

**Row Groups:** Parquet splits data into row groups. Each row group is a unit of parallelism — one Spark executor per row group. A 1 GB Parquet file with 8 row groups → 8 executors can read in parallel.

**Column Statistics:** Each column chunk stores min/max values. Spark uses these to skip entire row groups when the filter value is outside the min/max range — this is **predicate pushdown**.

---

## Predicate Pushdown in Practice

```python
# Spark with predicate pushdown on Parquet
df = spark.read.parquet("/silver/sales/") \
    .filter(col("order_date") >= "2024-01-01")

# Spark reads the footer of each Parquet file
# Checks: does this file's order_date range overlap with 2024-01-01+?
# If the file's max date is 2023-12-31 → SKIP the entire file
# Only files that MIGHT contain matching rows are read
```

This makes partitioned Parquet tables dramatically faster for date-filtered queries.

---

## Compression Codecs

| Codec | Compression ratio | Speed | CPU cost | Use case |
|-------|------------------|-------|----------|---------|
| **Snappy** (default) | Medium | Fast | Low | Default for analytics — good balance |
| **GZIP** | High | Slow | High | Archival, space-critical data |
| **ZSTD** | High | Fast | Medium | Better than GZIP + faster — use when possible |
| **LZ4** | Low | Very fast | Very low | Speed-critical, storage is cheap |
| **None** | None | Fastest reads | None | Rarely used |

```python
df.write \
    .option("compression", "snappy") \  # default
    .parquet("/silver/sales/")
```

---

## When NOT to Use Parquet

- **Streaming writes:** Parquet files are immutable. Streaming appends create many small files → use Delta instead
- **Single-row lookups:** Parquet reads an entire row group to find one row — use a database (Azure SQL, Cosmos DB) for point lookups
- **Frequent updates:** You can't update a row in a Parquet file — use Delta Lake for MERGE/UPDATE operations
- **External systems that don't support it:** Some legacy systems only accept CSV — export as CSV, store internally as Parquet

---

## Reading and Writing Parquet in Databricks

```python
# Write
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .option("compression", "snappy") \
    .parquet("abfss://silver@account.dfs.core.windows.net/sales/")

# Read with partition pruning
df = spark.read \
    .parquet("abfss://silver@account.dfs.core.windows.net/sales/") \
    .filter((col("year") == 2024) & (col("month") == 1))
# Only reads year=2024/month=1/ directory — skips everything else
```

---

## The Small File Problem

Writing Parquet in streaming or high-partition scenarios creates many small files:

```
year=2024/month=01/day=01/
  part-00000.snappy.parquet  (1 KB)
  part-00001.snappy.parquet  (1 KB)
  part-00002.snappy.parquet  (1 KB)
  ... 10,000 more small files
```

Many small files → slow reads (file listing overhead), high ADLS API call costs.

**Fix:** Use Delta with `OPTIMIZE` command to compact small files into larger ones. Or control Spark parallelism before write with `df.repartition(10)`.
