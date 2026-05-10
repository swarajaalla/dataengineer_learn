---
sidebar_position: 2
---

# System Design Scenarios

End-to-end system design examples for common data engineering interview questions and real-world architectures.

---

## How to Approach a System Design Question

1. **Clarify requirements** — batch or streaming? latency SLA? scale (rows/day)?
2. **Define the data flow** — source → ingest → store → transform → serve
3. **Choose storage layers** — raw, processed, serving
4. **Handle failures** — retries, DLQ, idempotency
5. **Address scale** — partitioning, parallelism, incremental loads
6. **Discuss trade-offs** — don't claim one solution is always right

---

## Scenario 1: Design a Batch Data Pipeline for an E-Commerce Platform

**Prompt:** "Design a pipeline that ingests orders, products, and customer data from an OLTP database into a data warehouse for reporting."

### Requirements
- 50 source tables, ~5M new orders/day
- Reports need to be fresh by 7am daily
- Historical data: 3 years
- Power BI dashboards query the Gold layer

### Architecture

```
SQL Server (OLTP)
    ↓ ADF — Incremental load via watermark (updated_at)
    ↓ Self-Hosted IR (on-prem → Azure)
ADLS Bronze
    ├── /orders/year=2024/month=01/day=15/*.parquet
    ├── /customers/year=2024/...
    └── /products/...
    ↓ Databricks (Spark) — bronze_to_silver notebook
ADLS Silver (Delta)
    ├── orders (partitioned by order_date, SCD1)
    ├── customers (SCD2 — track address changes)
    └── products (SCD1)
    ↓ Databricks (Spark) — silver_to_gold notebook
Gold (Delta / Databricks SQL)
    ├── fact_orders
    ├── dim_customer (SCD2)
    ├── dim_product
    └── dim_date
    ↓
Power BI (DirectQuery or Import)
```

### Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Ingest pattern | Incremental + watermark | 50 tables, full load too slow |
| Source connectivity | Self-Hosted IR | SQL Server is on-prem |
| Orchestration | ADF Tumbling Window | Supports backfill per window |
| Transform engine | Databricks Spark | Complex SCD2, large data |
| Gold format | Delta | MERGE support for upserts |
| Customer modeling | SCD2 | Need to track address changes for historical analysis |

### Failure Handling
- ADF retries on transient failures (3 retries, 30s delay)
- Tumbling Window tracks each day independently — rerun only failed day
- Databricks notebooks are idempotent — `MERGE` won't duplicate on rerun
- Alert on failure via ADF webhook → Teams channel

---

## Scenario 2: Design a Real-Time Streaming Pipeline

**Prompt:** "Design a pipeline to ingest clickstream events and show a live dashboard with 30-second latency."

### Requirements
- 100K events/second peak
- 30-second dashboard latency
- 90-day event history for ad-hoc analysis
- Events: page views, clicks, add-to-cart, purchases

### Architecture

```
Web/Mobile Apps
    ↓ SDK → Kafka (Event Hub)
    |  topic: clickstream (10 partitions, 7-day retention)
    |
    ├── Stream Path (30-second SLA)
    │   ↓ Spark Structured Streaming (micro-batch: 10 sec)
    │   ↓ Aggregate: events/minute per page, per user
    │   ↓ Delta table: gold.realtime_metrics (MERGE by minute window)
    │   ↓ Databricks SQL → Power BI / custom dashboard
    │
    └── Historical Path
        ↓ Kafka → Bronze Delta (append, partitioned by dt)
        ↓ Daily Spark job → Silver (sessionize, clean)
        ↓ Weekly Spark job → Gold (funnel analysis, cohorts)
```

### Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Message broker | Kafka (10 partitions) | 100K/sec needs parallelism |
| Stream processing | Structured Streaming | Micro-batch = simpler than true streaming |
| Latency tuning | 10-sec trigger interval | 30-sec SLA with buffer |
| Idempotency | MERGE by window key | Replayable from Kafka on failure |
| Historical storage | Bronze Delta | Replay from Bronze if Silver pipeline fails |
| Watermark | 2-minute late arrival | Handle network delays |

### Handling Late Data

```python
stream = spark.readStream \
    .format("kafka") \
    .option("subscribe", "clickstream") \
    .load()

df = stream \
    .withWatermark("event_ts", "2 minutes") \  # accept up to 2 min late
    .groupBy(
        window("event_ts", "1 minute"),
        "page_id"
    ) \
    .agg(count("*").alias("event_count"))

df.writeStream \
    .trigger(processingTime="10 seconds") \
    .outputMode("update") \
    .foreachBatch(merge_to_delta) \
    .start()
```

---

## Scenario 3: Design a Multi-Source Data Lake

**Prompt:** "The company has 10 source systems — CRM, ERP, billing, support tickets. Design a unified data lake."

### Requirements
- Different source formats: REST API, SQL DB, flat file drops, event stream
- Each source team owns their schema — central team can't control upstream
- Analytics team needs one place to query everything

### Architecture

```
Source Systems
    ├── Salesforce CRM     → ADF REST connector → Bronze/crm/
    ├── SAP ERP            → ADF SHIR → Bronze/sap/
    ├── Billing DB (PG)    → Debezium CDC → Kafka → Bronze/billing/
    ├── Support CSV drops  → ADLS Event Trigger → Bronze/support/
    └── IoT Device Events  → Event Hub → Bronze/iot/

Bronze Layer (ADLS)
    → Exact copy, no transformation, retain 2 years
    → Schema stored in Unity Catalog (raw schemas)

Silver Layer (Delta + Unity Catalog)
    → Standardized: common columns (_ingest_ts, _source, _batch_id)
    → Conformed types: dates as DATE, money as DECIMAL(18,2)
    → Deduplicated, validated
    → Schema in Unity Catalog (silver schemas, governed)

Gold Layer
    ├── Cross-source joins: orders (SAP) + support tickets (Zendesk)
    ├── 360° customer view: CRM + billing + support
    └── Domain datasets: finance/, customer/, operations/
```

### Schema Drift Handling

```python
# Bronze write — always accept new columns
df.write.format("delta") \
    .option("mergeSchema", "true") \
    .mode("append") \
    .save(bronze_path)

# Silver — explicit schema validation
expected_cols = {"order_id", "customer_id", "amount", "order_date"}
actual_cols = set(df.columns)

if not expected_cols.issubset(actual_cols):
    raise ValueError(f"Missing columns: {expected_cols - actual_cols}")
```

### Governance with Unity Catalog

```sql
-- Each source gets its own catalog
CREATE CATALOG crm_bronze;
CREATE CATALOG sap_bronze;
CREATE CATALOG silver;  -- conformed layer
CREATE CATALOG gold;    -- analytics layer

-- Source team: read-only on their own bronze
GRANT USE CATALOG ON CATALOG crm_bronze TO `crm-team`;
GRANT SELECT ON ALL TABLES IN CATALOG crm_bronze TO `crm-team`;

-- Analytics team: read on gold
GRANT USE CATALOG ON CATALOG gold TO `analytics-team`;
GRANT SELECT ON ALL TABLES IN CATALOG gold TO `analytics-team`;
```

---

## Scenario 4: Design a Data Quality Framework

**Prompt:** "Our pipelines run but nobody trusts the data. Design a data quality system."

### Architecture

```
Bronze (raw data)
    ↓ DQ Checks at Bronze → Silver boundary:
    │   ├── Completeness: NULL rate < 2% for key columns
    │   ├── Uniqueness: no duplicate primary keys
    │   ├── Referential: order's customer_id exists in customers
    │   ├── Range: amount between 0 and 100000
    │   └── Freshness: max(updated_at) within last 25 hours
    │
    ├── PASS → write to Silver
    └── FAIL → block write, alert, write to DQ failures table

DQ Results Table (gold.dq_results):
    pipeline, table, rule, passed_count, failed_count, run_ts

DQ Dashboard (Power BI / Databricks SQL):
    → Pass/fail trend per table over time
    → Alert when failure rate > threshold
```

```python
from databricks.sdk.runtime import *

def check_null_rate(df, col_name, threshold=0.02):
    total = df.count()
    nulls = df.filter(col(col_name).isNull()).count()
    null_rate = nulls / total
    return null_rate <= threshold, null_rate

def check_duplicates(df, key_cols):
    total = df.count()
    distinct = df.dropDuplicates(key_cols).count()
    return total == distinct, total - distinct

# Run checks, collect results
checks = [
    ("null_rate_order_id", *check_null_rate(df, "order_id", 0.001)),
    ("null_rate_amount", *check_null_rate(df, "amount", 0.02)),
    ("duplicates", *check_duplicates(df, ["order_id"])),
]

failures = [(name, rate) for name, passed, rate in checks if not passed]

if failures:
    raise Exception(f"DQ failures: {failures}")
```

---

## Common Interview Follow-Up Questions

**"How would you handle backfilling 2 years of historical data?"**
- Use ADF ForEach with date range parameter
- Tumbling Window trigger processes each month independently
- Run 6 parallel months at a time — don't backfill all at once (overwhelms source)
- Bronze → Silver → Gold in sequence per batch

**"What if the source schema changes?"**
- Bronze always accepts schema changes (`mergeSchema=true`)
- Silver fails explicitly if required columns are missing (catch it early)
- Alert pipeline owner, human reviews the change, updates Silver mapping

**"How do you test a data pipeline?"**
- Unit test: transformation functions with small fixture DataFrames
- Integration test: run full pipeline on a 1-day sample in a dev environment
- DQ checks: automated assertions on row counts, null rates, value ranges after every run
- Reconciliation: compare row counts between source and Silver after each load
