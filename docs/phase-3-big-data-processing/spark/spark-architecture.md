---
sidebar_position: 1
---

# Spark Architecture

Understanding how Spark works internally helps you write better code and debug performance issues.

---

## Core Components

```
Driver Program
    ├── SparkContext / SparkSession
    ├── DAG Scheduler
    └── Task Scheduler
            ↓
    Cluster Manager (Databricks / YARN / Kubernetes)
            ↓
    Worker Node 1    Worker Node 2    Worker Node N
    ├── Executor      ├── Executor      ├── Executor
    │   ├── Task 1    │   ├── Task 1    │   ├── Task 1
    │   └── Task 2    │   └── Task 2    │   └── Task 2
```

---

## Key Terms

| Term | Description |
|------|-------------|
| **Driver** | Coordinates the job — runs your Python code, builds the execution plan |
| **Executor** | Worker process on each node — runs tasks in parallel |
| **Task** | Smallest unit of work — processes one partition |
| **Stage** | Group of tasks that can run without a shuffle |
| **Job** | A complete action (e.g., `write()`) — contains multiple stages |
| **Partition** | A chunk of data — each partition is processed by one task |

---

## How Spark Executes Your Code

1. You write a DataFrame transformation chain
2. Spark builds a **logical plan** (what operations to do)
3. The **Catalyst optimizer** rewrites the plan for efficiency
4. The plan becomes a **DAG** of stages
5. Stages are split into **tasks** by partition count
6. Tasks are sent to executors and run in parallel

```python
# This builds a plan — nothing executes yet
df = spark.table("silver.orders")
df_filtered = df.filter(col("status") == "active")  # lazy
df_joined = df_filtered.join(df_customers, "customer_id")  # lazy

# This triggers execution — Spark executes the full plan
df_joined.write.format("delta").save("/mnt/gold/active_orders")  # ACTION
```

---

## Shuffle — The Most Expensive Operation

A shuffle occurs when data must be redistributed across partitions (different workers).

Triggered by: `groupBy`, `join`, `distinct`, `repartition`, `orderBy`

What happens during a shuffle:
1. Data written to disk on executors (spill)
2. Data transferred over the network to new executors
3. Data read and sorted into new partitions

**Cost:** Network I/O + disk I/O. On large datasets, shuffles are the bottleneck.

**Minimize shuffles by:**
- Filter data before joining (smaller input = smaller shuffle)
- Use broadcast joins for small tables (eliminates shuffle entirely)
- Cache intermediate results used multiple times
- Use bucketing for repeated joins on the same key

---

## Memory Architecture

Each executor has:
- **Execution memory** — used for shuffles, aggregations, sorting
- **Storage memory** — used for cached DataFrames
- **User memory** — your Python objects, UDFs
- **Reserved** — Spark internals

When execution memory is full, Spark spills to disk — this is slow.

```python
# Configure executor memory (in Databricks cluster config)
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.memory.fraction", "0.8")
```

---

## Spark UI (How to Debug)

In Databricks: click the job link while it's running or in history.

Key tabs:
- **Jobs** — see all jobs and their stages
- **Stages** — see tasks, time per stage, shuffle bytes
- **SQL** — see the physical plan with cost estimates
- **Executors** — memory usage, GC time per executor

Red flags to look for:
- One task taking 10x longer than others → **data skew**
- Large shuffle read/write → consider broadcast join or partitioning
- High GC time → memory pressure, reduce data or increase executor memory
