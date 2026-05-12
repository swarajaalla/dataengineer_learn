---
title: Spark Fundamentals
sidebar_position: 1
description: Learn Apache Spark fundamentals for Data Engineering
---

# Apache Spark Fundamentals

## What is Apache Spark?

Apache Spark is a distributed data processing engine designed for large-scale data processing and analytics.

It processes massive datasets across multiple machines in parallel.

---

## Why Spark Became Popular

Traditional systems like Hadoop MapReduce had major limitations:

- Slow due to disk-based processing
- Complex development
- Poor support for iterative workloads
- Not suitable for real-time processing

Spark solved this using:

- In-memory computation
- Faster execution
- Simple APIs
- Multi-language support
- Unified analytics engine

---

## Why Spark is Important for Data Engineers

Spark is heavily used in modern data platforms.

### Common Use Cases

- ETL Pipelines
- Batch Processing
- Streaming Pipelines
- Data Lake Processing
- Machine Learning
- Data Transformations
- Data Validation
- CDC Processing

---

## Core Features of Spark

| Feature | Description |
|---|---|
| In-Memory Processing | Faster than disk-heavy systems |
| Distributed Computing | Parallel execution across clusters |
| Fault Tolerance | Recover failed tasks automatically |
| Lazy Evaluation | Optimized execution planning |
| Scalability | Handles TBs/PBs of data |
| Multiple APIs | Python, Scala, SQL, Java, R |

---

# Spark Ecosystem

## Spark Core

Foundation engine responsible for:

- Task scheduling
- Memory management
- Fault recovery
- Distributed execution

---

## Spark SQL

Used for structured data processing.

Supports:
- SQL Queries
- DataFrames
- Structured APIs

Example:

```python
df = spark.read.csv("data.csv", header=True)

df.createOrReplaceTempView("customers")

spark.sql("""
SELECT country, COUNT(*)
FROM customers
GROUP BY country
""")
```

## PySpark
Python API for Apache Spark.

Most popular among Data Engineers because:
- Easy syntax
- Fast development
- Large ecosystem

Example:

from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("demo").getOrCreate()
## Spark Streaming

Processes real-time streaming data.

Common Sources:

- Kafka
- Event Hubs
- IoT Streams
- Logs

Example use cases:

- Fraud detection
- Real-time dashboards
- Monitoring systems
- MLlib

Machine Learning library in Spark.

Supports:

- Classification
- Regression
- Clustering
- Recommendation systems
- GraphX

Used for graph processing and network analysis.

Less commonly used in Data Engineering.
---

## Spark Processing Modes
Batch Processing 

Processes large chunks of historical data.

Example:
- Daily sales processing
- Nightly ETL jobs
- Stream Processing

Processes data continuously in near real-time.

Example:
- Sensor events
- Live transactions
- Clickstream analytics
--- 
## Spark Deployment Modes
|Mode	|Description|
|---|---|
| Local Mode 	|Runs on single machine|
| Standalone	|Spark's native cluster manager|
| YARN	|Hadoop ecosystem|
| Kubernetes	|Container orchestration|
| Databricks	|Managed Spark platform|

---
## Spark vs Hadoop MapReduce
| Spark                | Hadoop MapReduce |
| -------------------- | ---------------- |
| In-memory processing | Disk-based       |
| Faster               | Slower           |
| Easy APIs            | Complex coding   |
| Streaming support    | Limited          |
| Iterative processing | Poor             |
| Real-time capable    | Mostly batch     |
 ---

## Advantages of Spark
- High performance
- Easy scalability
- Unified analytics
- Strong ecosystem
- Cloud-native support
- Excellent for big data workloads
## Limitations of Spark
- High memory usage
- Small jobs may not benefit much
- Expensive cluster costs
- Poor optimization can cause huge failures

---
Where Spark is Commonly Used
- Cloud Platforms
- Azure Databricks
- AWS EMR
- Google Dataproc
## Storage Systems
- ADLS
- S3
- HDFS
- Delta Lake
## Data Sources
- Kafka
- SQL Databases
- NoSQL Databases
- APIs
- CSV/JSON/Parquet