---
sidebar_position: 1
---

# Data Processing Overview

Data processing transforms raw, messy ingested data into clean, trusted, query-ready data. It's where the business logic lives.

---

## Where Processing Fits

```
Bronze (raw) → Processing layer → Silver (clean) → Gold (serving)
```

The processing layer is the most complex part of any data platform. It's where:
- Nulls get handled
- Duplicates get removed
- Types get cast correctly
- Business rules get applied
- Tables get joined and enriched
- Aggregations get computed

---

## Processing Paradigms

| Paradigm | What it is | Latency | Tools |
|----------|-----------|---------|-------|
| **Batch** | Process a bounded dataset on a schedule | Minutes–hours | Spark, dbt, SQL |
| **Micro-batch** | Process small chunks continuously | Seconds–minutes | Spark Structured Streaming |
| **Streaming** | Process each event as it arrives | Milliseconds | Flink, Kafka Streams |

Most enterprise DE work is batch. Micro-batch for near-real-time. True streaming is rare.

---

## Processing Engines

| Engine | Language | Best for | Azure deployment |
|--------|----------|---------|-----------------|
| **Spark / PySpark** | Python / Scala | Large-scale batch and streaming | Databricks |
| **dbt** | SQL | SQL-based ELT transformations | dbt Cloud, or CLI in Databricks |
| **Pandas** | Python | Small data (< 5 GB), prototyping | Any Python environment |
| **SQL** | SQL | Synapse, Databricks SQL, Snowflake | Synapse, Databricks SQL |
| **Azure Data Flow** | GUI | Simple transforms, no-code | ADF Mapping Data Flows |

**Rule:** Use Spark/PySpark for anything > 5 GB or needing cluster parallelism. Don't use pandas at scale.

---

## The Processing Stack (Bronze → Silver → Gold)

**Bronze → Silver (data cleaning layer):**
- Cast types correctly (strings → dates, integers, decimals)
- Handle nulls (fill, drop, flag)
- Remove duplicates (deduplication by primary key or composite key)
- Validate against business rules (reject or quarantine bad records)
- Flatten nested structures (JSON → relational)
- Standardize formats (date formats, case, trimming)

**Silver → Gold (business logic layer):**
- Join dimension tables to fact tables
- Apply SCD logic for history-preserving dimensions
- Aggregate (daily revenue by product, monthly active customers)
- Apply business rules (revenue = quantity × price - discount)
- Build star schema tables

---

## Processing vs Ingestion: The Boundary

```
Ingestion (don't put logic here):
  Source → ADF Copy → Bronze ADLS
  
Processing (put your logic here):
  Bronze → Databricks notebook → Silver Delta
           ↑
     Type casting, dedup, validation, enrichment
```

If you transform in the ingestion layer and the logic is wrong, you have to re-ingest from source. If you transform in the processing layer, you re-run from Bronze — fast and cheap.
