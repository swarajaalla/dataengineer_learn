---
sidebar_position: 1
---

# File Formats Overview

File format choice affects storage cost, query performance, pipeline throughput, and compatibility with downstream tools. Getting it wrong is expensive to fix at scale.

---

## Quick Comparison

| Format | Type | Schema | Compression | Splittable | Best for |
|--------|------|--------|-------------|------------|---------|
| **CSV** | Row | None | Optional | No (gzip) / Yes (uncompressed) | Simple data exchange, source exports |
| **JSON** | Row | Self-describing | Optional | No (gzip) / Yes (JSONL) | REST API responses, semi-structured data |
| **Parquet** | Columnar | Yes (embedded) | Yes (Snappy/GZIP) | Yes (row groups) | Analytical queries, data lake storage |
| **Avro** | Row | Yes (embedded) | Yes | Yes | Kafka streaming, schema evolution |
| **ORC** | Columnar | Yes | Yes (ZLIB) | Yes | Hive workloads, Hadoop ecosystem |
| **Delta** | Columnar + log | Yes + enforced | Yes | Yes | Lakehouse, ACID, time travel |

---

## The Format Decision Tree

```
Is this data from a source system (extract/export)?
  → Land as-is (CSV/JSON) in Bronze — don't transform format during ingestion

Is this data for analytical queries?
  → Use Parquet or Delta (columnar = 10-100x faster than CSV for analytics)

Is this data going through Kafka / streaming?
  → Use Avro with schema registry

Do you need ACID, time travel, UPDATE/DELETE?
  → Use Delta (it IS Parquet under the hood, adds the log)

Do you need to share data with external systems that don't know Delta?
  → Export as Parquet
```

---

## Format Evolution in Data Engineering

```
CSV Era (pre-2010)
  └── Simple, human-readable, universal — but slow and no schema

JSON Era (2010–2015)
  └── APIs made JSON ubiquitous — flexible but terrible for analytics

Columnar Era (2015–2020)
  └── Parquet and ORC: designed for analytical workloads, 10-100x faster

Lakehouse Era (2020+)
  └── Delta Lake: Parquet + ACID + time travel — the new standard
```

---

## Storage Cost Reality

1 TB of raw CSV data:
- CSV (uncompressed): 1 TB, $20/month on ADLS
- CSV (gzip): ~300 GB, $6/month
- Parquet (Snappy): ~100-200 GB, $2-4/month
- Delta (Snappy): ~100-200 GB + tiny log overhead

**Converting CSV to Parquet typically reduces storage by 5-10x** — and query performance improves far more than that.

---

## Rule of Thumb

| Layer | Recommended format |
|-------|-------------------|
| **Bronze (landing)** | Keep source format (CSV/JSON/Parquet) |
| **Silver (clean)** | Delta |
| **Gold (serving)** | Delta |
| **Data sharing** | Parquet |
| **Kafka / Streaming** | Avro |
