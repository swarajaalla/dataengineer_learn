---
sidebar_position: 4
---

# Scalability Patterns

How to design pipelines that handle 10x data growth without rewriting the architecture.

---

## Why Pipelines Break at Scale

A pipeline that works fine at 1GB/day often breaks at 100GB/day due to:
- **Small files** — thousands of tiny files kill Spark job planning time
- **Data skew** — one partition has 80% of the data, one executor does all the work
- **Shuffle bottlenecks** — wide transformations (joins, GROUP BY) move data across the network
- **Serial processing** — each table processed sequentially instead of in parallel

---

## Horizontal Scaling — Partition Your Work

Split large jobs into independent chunks that run in parallel.

```python
# Serial — processes one month at a time (slow)
for month in months:
    process_month(month)

# Parallel — ADF ForEach with parallel batches
# ADF ForEach Activity → set "Batch Count" = 8 → 8 months run simultaneously

# Spark — partition the job by a key column
df.repartition(200, col("customer_id"))  # 200 partitions processed in parallel
```

---

## Handling Data Skew

Skew = some partition has dramatically more rows than others → one executor runs 10x longer.

```python
# Diagnose skew
df.groupBy(spark_partition_id()).count().orderBy(desc("count")).show()

# Fix 1: Salt the join key (for skewed joins)
from pyspark.sql.functions import concat, lit, floor, rand

# Add random salt 0-9 to skewed key
orders_salted = orders.withColumn("salted_key",
    concat(col("customer_id"), lit("_"), (rand() * 10).cast("int")))

# Explode the small table to match all salt values
dim_salted = dim_customers.crossJoin(
    spark.range(10).toDF("salt")
).withColumn("salted_key",
    concat(col("customer_id"), lit("_"), col("salt")))

# Join on salted key
result = orders_salted.join(dim_salted, "salted_key")

# Fix 2: Enable AQE (Adaptive Query Execution) — handles skew automatically
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

---

## Optimize Shuffles

Shuffle = moving data between executors across the network — the most expensive operation in Spark.

```python
# Reduce shuffle partitions (default 200 is too many for small data)
spark.conf.set("spark.sql.shuffle.partitions", "50")

# Enable AQE to set shuffle partitions dynamically
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# Broadcast join — send small table to every executor, avoid shuffle
from pyspark.sql.functions import broadcast

result = orders.join(
    broadcast(dim_date),  # dim_date < 50MB → broadcast
    on="order_date"
)

# Check if broadcast is being used
result.explain()  # look for BroadcastHashJoin in plan
```

---

## Small File Problem

Too many small files → Spark spends more time planning than executing.

**Symptom:** 10,000 files of 2MB each → slow reads, slow job planning.

**Fix: OPTIMIZE + ZORDER**

```sql
-- Compact small files in Delta table
OPTIMIZE silver.orders;

-- Compact + sort by frequently-filtered column (speeds up range queries)
OPTIMIZE silver.orders ZORDER BY (customer_id, order_date);

-- Schedule this weekly via Databricks Workflow
```

**Prevent small files at write time:**

```python
# Write with coalesce to control output file count
df \
    .coalesce(10)  # max 10 output files for this partition
    .write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", "order_date = '2024-01-15'") \
    .saveAsTable("silver.orders")
```

---

## Parallel Pipeline Execution

Don't process tables serially — run independent pipelines in parallel.

```
Serial (slow):
orders → products → customers → transactions  (each waits for previous)

Parallel (fast):
orders    ──────────────────────┐
products  ──────────────────────┤ → Gold layer (depends on all)
customers ──────────────────────┤
transactions ───────────────────┘
```

**In ADF:** Use parallel Execute Pipeline activities, set `Batch Count` on ForEach loops.

**In Databricks Workflows:** Set task dependencies — independent tasks run in parallel automatically.

```python
# Databricks Workflow DAG — tasks with no dependency run concurrently
# Task A: load_orders (no dependency)
# Task B: load_products (no dependency)
# Task C: load_customers (no dependency)
# Task D: build_gold (depends on A, B, C)

# D only starts after A, B, C all succeed
```

---

## Partitioned Processing — Process Only What Changed

```python
import argparse
from datetime import datetime, timedelta

parser = argparse.ArgumentParser()
parser.add_argument("--run_date", default=str(datetime.now().date()))
args = parser.parse_args()

run_date = args.run_date

# Only process today's partition
df = spark.read.format("delta").load(bronze_path) \
    .filter(f"order_date = '{run_date}'")

df.write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", f"order_date = '{run_date}'") \
    .saveAsTable("silver.orders")
```

**Result:** Processing 1 day instead of 3 years → 1000x faster than full reprocessing.

---

## Caching — Reuse Expensive Computations

```python
# Cache a DataFrame that's used multiple times in the same job
df_orders = spark.read.format("delta").load(silver_path) \
    .filter("order_date >= '2024-01-01'")

df_orders.cache()  # persists in executor memory

# Used multiple times without re-reading from storage
revenue_by_region = df_orders.groupBy("region").agg(sum("amount"))
orders_by_customer = df_orders.groupBy("customer_id").count()
top_products = df_orders.groupBy("product_id").agg(sum("quantity")).orderBy(desc("sum(quantity)"))

df_orders.unpersist()  # release memory when done
```

**When NOT to cache:** Tables larger than available executor memory — cache misses are worse than reading from Delta (Delta has file-level caching).

---

## Cluster Sizing Guidelines

| Job Type | Workers | Worker Type |
|----------|---------|-------------|
| Small aggregations (under 10GB) | 2–4 | Standard (8 core, 32GB) |
| Medium ETL (10–100GB) | 4–8 | Standard |
| Large joins / shuffles (100GB+) | 8–16 | Memory-optimized |
| Streaming (always-on) | 2–4 | Standard + auto-scale |

**Auto-scaling:** Set min/max workers — cluster scales up during heavy shuffle phases and scales down during reads. Saves cost on variable workloads.

```python
# Databricks cluster config with auto-scale
{
    "autoscale": {
        "min_workers": 2,
        "max_workers": 8
    },
    "node_type_id": "Standard_DS3_v2",
    "spark_version": "14.3.x-scala2.12"
}
```
