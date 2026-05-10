---
sidebar_position: 1
---

# Data Ingestion Overview

Data ingestion is the process of moving data from source systems to your data platform. The goal is to copy data faithfully — not transform it. That comes later.

---

## The Role of the Ingestion Layer

```
Source systems          Ingestion layer          Landing zone
(SAP, APIs, files)  →  (ADF, Kafka, Python)  →  (ADLS Bronze)
```

**Ingestion should:**
- Copy data accurately, preserving the source format
- Track what was ingested and when
- Handle failures gracefully (retry, alert)
- Be fast and efficient

**Ingestion should NOT:**
- Transform data (clean, join, aggregate)
- Apply business logic
- Write directly to Silver or Gold layers

Breaking this rule makes pipelines fragile. If transformation logic is wrong, you have to re-ingest from source.

---

## Key Ingestion Decisions

**1. Batch vs Streaming**

| | Batch | Streaming |
|--|-------|-----------|
| **Timing** | Scheduled (hourly, daily) | Continuous |
| **Latency** | Minutes to hours | Seconds |
| **Complexity** | Low | High |
| **Use case** | Daily extracts, file drops | IoT, fraud, clickstream |

**2. Full Load vs Incremental**

| | Full Load | Incremental |
|--|-----------|------------|
| **What** | Copy everything every time | Only new/changed records |
| **When** | Small tables, no delta column | Large tables with timestamp or CDC |
| **Cost** | High (reads all data) | Low (reads only changes) |

**3. Push vs Pull**

- **Pull:** Pipeline queries the source on a schedule (most common — ADF Copy Activity)
- **Push:** Source publishes to a broker (Kafka, Event Hub), pipeline consumes

---

## Ingestion Tools Landscape

| Tool | Type | Best for |
|------|------|---------|
| **Azure Data Factory** | Batch + managed | Enterprise, multi-source, GUI-based |
| **Fivetran / Airbyte** | SaaS connectors | Pre-built connectors, low-code |
| **Debezium** | CDC streaming | Database change capture |
| **Kafka / Event Hub** | Event streaming | High-throughput event ingestion |
| **Python scripts** | Custom | APIs with complex auth/pagination |
| **Databricks Auto Loader** | Streaming files | ADLS file landing → Databricks |

---

## Common Sources in Enterprise DE

| Source | Type | Ingestion method |
|--------|------|-----------------|
| SAP ERP | Relational DB | ADF JDBC connector or SAP connector |
| Salesforce | SaaS API | Fivetran or ADF REST connector |
| SQL Server / Oracle | Relational DB | ADF JDBC or CDC (Debezium) |
| SFTP files | File drop | ADF SFTP connector or Azure Functions |
| REST APIs | HTTP | ADF Web Activity or Python |
| Kafka / Event Hub | Event stream | Databricks Structured Streaming |
| Blob / S3 | Object storage | ADF Copy Activity or Auto Loader |

---

## The Ingestion Antipattern to Avoid

```
BAD: Ingest + Transform in one step
Source → ADF Data Flow (transform) → Silver Delta table
Problem: If transformation logic changes, you must re-ingest from source

GOOD: Separate ingestion from transformation
Source → ADF Copy Activity → Bronze ADLS (raw)
Bronze ADLS → Databricks → Silver Delta table
Benefit: Transformation can be re-run from Bronze without re-ingesting
```

Always land raw. Transform separately.
