---
sidebar_position: 4
---
# Advanced Spark Concepts for Data Processing

## Why These Concepts Matter

Most beginners learn:
- Transformations
- Actions
- Basic optimization

But real-world Spark projects require deeper understanding of:
- Execution internals
- Memory management
- File formats
- Serialization
- Streaming
- Data skew handling
- Fault tolerance

These concepts are critical in production-grade data engineering systems.

---

# Spark Execution Flow

## High-Level Flow

```text
Spark Application
      ↓
Driver Program
      ↓
Logical Plan
      ↓
Catalyst Optimizer
      ↓
Physical Plan
      ↓
Tasks Distributed to Executors
      ↓
Results Returned
```

---

# SparkSession

## What is SparkSession?

Entry point to Spark application.

Introduced in Spark 2.x.

Combines:
- SQLContext
- HiveContext
- SparkContext

---

## Example

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("SparkApp") \
    .getOrCreate()
```

---

# SparkContext

## What is SparkContext?

Low-level core engine connection.

Responsible for:
- Cluster communication
- Resource allocation
- Job scheduling

---

## Accessing SparkContext

```python
sc = spark.sparkContext
```

---

# Spark Jobs, Stages and Tasks

# Job

Created when an action is triggered.

Example:
```python
df.count()
```

creates a Spark job.

---

# Stage

A job is divided into stages.

Stage boundary usually occurs during shuffle.

---

# Task

Smallest execution unit.

Each partition generally creates one task.

---

# Flow Example

```text
Action
   ↓
Job
   ↓
Stages
   ↓
Tasks
```

---

# Spark Partitioning

## What is Partitioning?

Spark divides data into partitions for parallel processing.

---

## Why Partitions Matter

Partitions directly affect:
- Parallelism
- Performance
- Memory usage

---

# Checking Partitions

```python
df.rdd.getNumPartitions()
```

---

# Increasing Partitions

```python
df.repartition(10)
```

---

# Reducing Partitions

```python
df.coalesce(2)
```

---

# Partitioning Best Practices

- Too few partitions → underutilization
- Too many partitions → scheduling overhead

---

# Persistence in Spark

# cache()

Stores DataFrame in memory.

```python
df.cache()
```

---

# persist()

More control over storage level.

```python
from pyspark import StorageLevel

df.persist(StorageLevel.MEMORY_AND_DISK)
```

---

# Storage Levels

| Storage Level | Description |
|---|---|
| MEMORY_ONLY | Store in RAM |
| MEMORY_AND_DISK | Spill to disk if needed |
| DISK_ONLY | Store only on disk |

---

# Serialization

## What is Serialization?

Converting objects into byte stream for transfer/storage.

Spark transfers serialized data between executors.

---

# Serialization Types

| Type | Description |
|---|---|
| Java Serialization | Default |
| Kryo Serialization | Faster and compact |

---

# Enable Kryo

```python
spark.conf.set(
    "spark.serializer",
    "org.apache.spark.serializer.KryoSerializer"
)
```

---

# Catalyst Optimizer

## What is Catalyst?

Spark SQL query optimizer.

Automatically improves execution plans.

---

# Catalyst Performs

- Predicate pushdown
- Constant folding
- Column pruning
- Join optimization

---

# Tungsten Engine

## What is Tungsten?

Spark memory and CPU optimization engine.

Improves:
- Memory efficiency
- CPU usage
- Binary processing

---

# DAG Scheduler

## What is DAG Scheduler?

Converts jobs into stages.

Creates Directed Acyclic Graph for execution.

---

# Responsibilities

- Stage creation
- Fault recovery
- Task scheduling

---

# Task Scheduler

## What is Task Scheduler?

Assigns tasks to executors.

Handles:
- Resource allocation
- Task execution

---

# Spark Memory Management

Spark memory divided into:

```text
Executor Memory
   ├── Storage Memory
   └── Execution Memory
```

---

# Storage Memory

Used for:
- Cache
- Persisted DataFrames

---

# Execution Memory

Used for:
- Shuffle
- Joins
- Aggregations

---

# Common Memory Issues

- OutOfMemoryError
- Excessive caching
- Huge shuffle operations

---

# Broadcast Variables

## What are Broadcast Variables?

Read-only shared variables distributed to executors.

Useful for:
- Lookup tables
- Small configuration data

---

## Example

```python
broadcast_data = sc.broadcast({
    "IN": "India",
    "US": "United States"
})
```

---

# Accumulators

## What are Accumulators?

Variables used for counters across executors.

---

## Example

```python
counter = sc.accumulator(0)
```

---

# UDF (User Defined Function)

## What is UDF?

Custom transformation function.

---

## Example

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import StringType

def upper_case(x):
    return x.upper()

upper_udf = udf(upper_case, StringType())
```

---

# Problems with UDFs

- Slower performance
- Break Catalyst optimization

Prefer built-in functions whenever possible.

---

# Window Functions

## What are Window Functions?

Perform calculations across group of rows without collapsing data.

---

# Common Window Functions

- row_number()
- rank()
- dense_rank()
- lag()
- lead()

---

## Example

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number

window_spec = Window.partitionBy("dept")

df.withColumn(
    "row_num",
    row_number().over(window_spec)
)
```

---

# File Formats in Spark

# CSV

Pros:
- Human readable

Cons:
- Slow
- No schema support

---

# JSON

Semi-structured format.

Useful for APIs and logs.

---

# Parquet

Best for analytics workloads.

Advantages:
- Columnar
- Compressed
- Faster reads

---

# Delta Lake

Advanced storage layer.

Supports:
- ACID transactions
- Time travel
- Schema evolution

---

# Schema Enforcement

## Why Important?

Prevents bad data from entering pipelines.

---

# Example

```python
from pyspark.sql.types import *

schema = StructType([
    StructField("id", IntegerType()),
    StructField("name", StringType())
])
```

---

# Reading Data with Schema

```python
df = spark.read.schema(schema).csv("data/")
```

---

# Handling Corrupt Records

```python
spark.read.option(
    "mode",
    "PERMISSIVE"
)
```

---

# Spark Streaming Basics

## What is Structured Streaming?

Real-time processing engine built on Spark SQL.

---

# Common Streaming Sources

- Kafka
- Event Hubs
- IoT devices
- Log streams

---

# Streaming Example

```python
stream_df = spark.readStream \
    .format("kafka") \
    .load()
```

---

# Streaming Output Modes

| Mode | Description |
|---|---|
| append | Only new rows |
| complete | Entire result |
| update | Updated rows |

---

# Checkpointing

## What is Checkpointing?

Stores streaming progress for fault tolerance.

---

## Example

```python
df.writeStream \
    .option(
        "checkpointLocation",
        "/checkpoints/"
    )
```

---

# Fault Tolerance in Spark

Spark automatically recovers failed tasks using:
- Lineage
- DAG recomputation
- Checkpointing

---

# Data Skew Handling

# Symptoms

- One task takes much longer
- Uneven executor utilization

---

# Solutions

- Salting
- Broadcast joins
- Better partitioning
- AQE

---

# Explain Plan

## Why Important?

Shows Spark execution plan.

Useful for debugging performance.

---

## Example

```python
df.explain(True)
```

---

# Types of Explain Plans

| Plan | Purpose |
|---|---|
| Parsed Logical Plan | Raw query |
| Analyzed Logical Plan | Validated query |
| Optimized Logical Plan | Optimized query |
| Physical Plan | Actual execution |

---

# Spark SQL vs DataFrame API

| Spark SQL | DataFrame API |
|---|---|
| SQL syntax | Programmatic |
| Easy for analysts | Better for developers |
| Good readability | Better flexibility |

---

# Real-World ETL Example

```text
SAP Tables
      ↓
ADF Ingestion
      ↓
ADLS Raw Zone
      ↓
Spark Cleansing
      ↓
Deduplication
      ↓
Business Transformations
      ↓
Delta Curated Tables
      ↓
Power BI
```

---

# Common Production Problems

## Executor OOM

Causes:
- Large shuffle
- Excessive caching

---

## Small File Explosion

Causes:
- Streaming micro-batches
- Excessive partitioning

---

## Skewed Joins

Causes:
- Uneven key distribution

---

# Spark Best Practices

- Prefer DataFrames
- Use built-in functions
- Avoid Python UDFs
- Monitor Spark UI
- Partition wisely
- Optimize joins
- Use Delta Lake
- Enable AQE
- Avoid collect()
- Filter early

---

# Most Important Interview Topics

- Lazy evaluation
- Narrow vs wide transformations
- Shuffle
- Broadcast joins
- Partitioning
- Catalyst optimizer
- AQE
- Data skew
- Window functions
- Delta Lake
- Structured Streaming

---

# Final Thoughts

Learning Spark syntax is easy.

Real expertise comes from understanding:
- Distributed systems
- Execution internals
- Performance tuning
- Data layout
- Cluster behavior
- Failure handling

This is what separates:
- Beginner Spark developers
from
- Production-grade Data Engineers