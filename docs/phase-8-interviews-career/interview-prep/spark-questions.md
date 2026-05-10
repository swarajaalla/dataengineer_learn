---
sidebar_position: 2
---

# Spark & PySpark Interview Questions

The most common Spark questions in senior data engineering interviews.

---

## Q1: What is lazy evaluation in Spark?

Spark doesn't execute transformations immediately. It builds an execution plan (DAG) and only runs it when an action (like `write()`, `count()`, `show()`) is triggered.

**Why it matters:** Spark can optimize the entire plan before running. For example, if you filter after a join, Spark may push the filter before the join (predicate pushdown) to reduce data processed.

```python
# These lines don't execute — they build a plan
df_filtered = df.filter(col("status") == "active")   # lazy
df_joined = df_filtered.join(df_customers, "id")     # lazy

# This triggers execution
df_joined.write.format("delta").save(...)             # ACTION
```

---

## Q2: Explain the difference between `repartition()` and `coalesce()`

| | `repartition(n)` | `coalesce(n)` |
|--|-----------------|---------------|
| **Shuffle** | Full shuffle | No full shuffle |
| **Direction** | Increase or decrease | Only decrease |
| **Use when** | Rebalancing skewed data | Reducing small partitions before write |

```python
# Use repartition to balance skewed data before a join
df = df.repartition(200, "customer_id")

# Use coalesce to reduce files before writing
df.coalesce(10).write.format("parquet").save(...)
```

---

## Q3: What is data skew and how do you fix it?

Skew: one partition has 10x more data than others. One task takes forever, others finish quickly.

**Symptoms:** One task in the Spark UI shows 10x execution time vs others.

**Fixes:**

1. **Broadcast join** (if one table is small):
```python
from pyspark.sql.functions import broadcast
df = df_large.join(broadcast(df_small), on="region_id")
```

2. **Salting** (for skewed large-to-large joins):
```python
from pyspark.sql.functions import concat, lit, expr
import random

# Add random salt to skewed key (distribute across N buckets)
N = 10
df_large = df_large.withColumn("salted_key", concat(col("customer_id"), lit("_"), (rand() * N).cast("int").cast("string")))
df_small = df_small.crossJoin(spark.range(N).withColumnRenamed("id", "salt")).withColumn("salted_key", concat(col("customer_id"), lit("_"), col("salt").cast("string")))

df_joined = df_large.join(df_small, on="salted_key")
```

3. **Adaptive Query Execution (AQE)**:
```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

---

## Q4: What is the difference between narrow and wide transformations?

**Narrow:** Each input partition maps to one output partition. No data movement. Fast.  
Examples: `filter`, `select`, `map`, `withColumn`, `union`

**Wide:** Requires shuffling — data moves across executors. Slow.  
Examples: `groupBy`, `join`, `distinct`, `repartition`, `orderBy`

Minimize wide transformations. Filter before joining to reduce shuffle size.

---

## Q5: What causes an OOM (OutOfMemoryError) in Spark?

Common causes:
1. `collect()` on a large DataFrame — pulls all data to driver
2. Too many cached DataFrames — fills executor memory
3. Large broadcast join — broadcasting a table that's too big
4. Too many small shuffles — each shuffle uses memory
5. Python UDFs — serialize/deserialize all data through Python

**Fix:**
- Use `write()` instead of `collect()`
- `unpersist()` cached DataFrames when done
- Only broadcast tables < 100MB
- Increase executor memory or reduce partition size

---

## Q6: How do you optimize a slow Spark job?

**Checklist:**

1. Open Spark UI → find the slow stage
2. Check for data skew (one task >> others)
3. Check shuffle size — large shuffle = consider broadcast or repartition by join key
4. Check for small files — hundreds of tiny files = add `OPTIMIZE` or `coalesce()` before write
5. Check filter placement — filter before join (predicate pushdown)
6. Check for Python UDFs — replace with built-in Spark functions
7. Check partition count — too few (< CPU count) = under-parallelized, too many = small files

---

## Q7: What is the difference between `cache()` and `persist()`?

`cache()` = `persist(StorageLevel.MEMORY_AND_DISK)`

`persist()` lets you choose the storage level:

```python
from pyspark import StorageLevel

df.persist(StorageLevel.MEMORY_ONLY)          # Memory only — fastest, may spill
df.persist(StorageLevel.MEMORY_AND_DISK)      # Memory, spill to disk if needed (default cache)
df.persist(StorageLevel.DISK_ONLY)            # Disk only — slowest but uses no memory
```

Always `unpersist()` when done to free memory.

---

## Q8: What happens during a shuffle?

1. Records are written to disk (shuffle write) — each executor writes shuffle files partitioned by target partition
2. Data is transferred over the network (shuffle read) — each executor reads its partition from all other executors
3. Data is sorted and merged into the new partition

**Cost:** Disk I/O + network I/O. For 1TB of data, a shuffle can add minutes.

**Watch for in Spark UI:** High "Shuffle Read" and "Shuffle Write" bytes in a stage.
