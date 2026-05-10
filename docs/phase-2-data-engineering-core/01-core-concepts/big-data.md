---
sidebar_position: 2
---

# Big Data

Big data refers to datasets too large, fast, or complex for traditional tools (Excel, single-server SQL databases) to handle efficiently. It's not a product — it's a problem category that requires a different class of tools.

---

## The 5 Vs

| V | What it means | Real example |
|---|--------------|--------------|
| **Volume** | Amount of data | 10 TB of SAP transactions daily |
| **Velocity** | Speed of data generation | 1M events/second from IoT sensors |
| **Variety** | Different formats and types | JSON from APIs, CSV from SFTP, Parquet from warehouse |
| **Veracity** | Data quality and trustworthiness | Duplicate records, missing values, inconsistent formats |
| **Value** | Business utility of the data | Revenue forecasts, fraud detection, churn prediction |

The first three Vs are technical problems. The last two are organizational problems — and harder to solve.

---

## When Is Data "Big Enough" to Need Special Tooling?

| Data Size | Appropriate Tool |
|-----------|-----------------|
| < 1 GB | pandas, SQL Server, Excel |
| 1 GB – 100 GB | PostgreSQL, SQL Server, optimized queries |
| 100 GB – 10 TB | Spark on a small cluster, Synapse, Snowflake |
| 10 TB+ | Databricks, distributed Spark, cloud warehouse |

The threshold isn't just size — it's also **query complexity** and **concurrency**. A 50 GB table with complex window functions and 100 concurrent users needs distributed compute even though 50 GB sounds manageable.

---

## The Big Data Tool Evolution

```
Hadoop (2006)
  ↓ MapReduce — batch only, slow, complex to operate
  
Hive / Pig (2008–2012)
  ↓ SQL on top of Hadoop — better UX, still slow
  
Spark (2014)
  ↓ In-memory processing, 100x faster than MapReduce
  ↓ Batch + streaming in one engine
  
Databricks (2015+)
  ↓ Managed Spark + Delta Lake + Unity Catalog
  ↓ Where most enterprises are today
  
Serverless (2020+)
  ↓ BigQuery, Synapse Serverless, Athena
  ↓ No cluster management, pay per query
```

Hadoop is largely dead for new projects. Spark (managed via Databricks or EMR) is the standard.

---

## Why Traditional Databases Fail at Big Data

A traditional SQL Server or PostgreSQL instance runs on **one machine**. No matter how much RAM you add, there's a ceiling:

- Can't process 10 TB in memory
- Can't parallelize reads across 100 nodes
- Writes slow down as indexes grow
- No concept of distributed shuffle

Distributed systems like Spark split data across **many nodes** and process partitions in parallel. A 10 TB file becomes 1,000 × 10 GB chunks processed simultaneously.

---

## Distributed Processing: How It Works

```
Master (Driver)
  ├── splits job into tasks
  └── coordinates workers

Worker 1 → reads Partition 1 (10M rows) → transforms → writes result
Worker 2 → reads Partition 2 (10M rows) → transforms → writes result
Worker 3 → reads Partition 3 (10M rows) → transforms → writes result
...
Worker N → reads Partition N (10M rows) → transforms → writes result

Driver → collects results → final output
```

This is why Spark can process 10 TB in minutes — work is parallelized across a cluster.

---

## Real Scenario: 10 TB of SAP Daily

```
Problem:
- SAP exports 10 TB of transaction data every night
- Business needs aggregated reports by 6 AM
- Single SQL Server: query takes 14 hours → misses deadline

Solution:
- ADF copies SAP export to ADLS (Parquet, partitioned by date)
- Databricks cluster (32 nodes) reads in parallel
- Transformations complete in 45 minutes
- Delta Gold tables ready for Power BI by 4 AM
```

The data didn't change. The architecture did.
