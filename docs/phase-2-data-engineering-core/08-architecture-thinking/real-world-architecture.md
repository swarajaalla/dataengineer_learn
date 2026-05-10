---
sidebar_position: 5
---

# Real-World Architecture Examples

Three complete architectures with design decisions, trade-offs, and failure modes. These are patterns from real enterprise data platforms.

---

## Architecture 1: Enterprise Batch Pipeline (Azure)

**The scenario:** Large manufacturing company. SAP ERP, Salesforce CRM, and 15 SFTP file feeds. 50 data analysts need Power BI dashboards refreshed by 6 AM daily.

```
┌──────────────────────────────────────────────────────────────────┐
│  SOURCES                                                          │
│  SAP ECC (10 tables) + Salesforce (5 objects) + SFTP (15 files)  │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  INGESTION: ADF (metadata-driven)                                 │
│  - 1 pipeline template, 30+ sources in config table              │
│  - Watermark-based incremental for databases                      │
│  - Event trigger for SFTP files                                   │
│  - Schedule: 01:00 UTC daily                                      │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  BRONZE: ADLS Gen2                                                │
│  - Raw format: Parquet (from DB) / JSONL (from Salesforce API)   │
│  - Partitioned by source_date                                     │
│  - Retention: 2 years (immutable)                                 │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  PROCESSING: Databricks (Workflows)                               │
│  - Bronze → Silver: clean, type, dedup, validate (02:00–03:30)   │
│  - Silver → Gold: star schema, SCD2 dims, fact tables (03:30–05:00)│
│  - OPTIMIZE + ZORDER run on Gold tables (05:00–05:30)            │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  SERVING                                                          │
│  - Unity Catalog: governance, lineage, column masking for PII     │
│  - Databricks SQL Warehouse: BI queries from Power BI             │
│  - Power BI: DirectQuery on Gold tables, refreshed at 05:30       │
└──────────────────────────────────────────────────────────────────┘
```

**Key design decisions made:**
- Watermark-based over CDC: SAP JDBC access doesn't support log-based CDC in this org
- Databricks SQL (not Synapse): single platform for both processing and serving
- Unity Catalog: mandatory for GDPR compliance — column masking on customer email/phone

**Trade-offs accepted:**
- 5-hour latency (data up to 5 hours old at refresh) — acceptable for daily dashboards
- No real-time data — business confirmed daily refresh is sufficient

**What could go wrong:**
- SAP export job delayed → ingestion window missed → Power BI shows yesterday's data. Fix: ADF alert + retry, SLA buffer built in
- Silver job fails on bad data → downstream Gold doesn't run → 06:00 dashboard fails. Fix: quarantine bad records, don't block the pipeline

---

## Architecture 2: Real-Time Streaming Pipeline

**The scenario:** E-commerce platform. Need real-time fraud detection (< 5 second decision) and live order status tracking.

```
┌──────────────────────────────────────────────────────────────────┐
│  EVENT SOURCES                                                    │
│  Order Service + Payment Service + Inventory Service              │
│  (produce events on every state change)                           │
└─────────────────────┬────────────────────────────────────────────┘
                      │ Kafka events (Avro + Schema Registry)
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  MESSAGE BROKER: Azure Event Hubs (32 partitions, 7-day retention)│
│  Topics: orders, payments, inventory-events                       │
└──────────────┬──────────────────────────────────────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐   ┌────────────────────────────────────┐
│  FRAUD DETECTION     │   │  ANALYTICS PIPELINE                │
│  (Flink, < 2 sec)    │   │  (Databricks Structured Streaming) │
│  - ML model scoring  │   │  - Trigger: 30 seconds             │
│  - Block or approve  │   │  - Writes to Delta Bronze          │
│  - Azure Stream      │   │  - Checkpoint: ADLS                │
│    Analytics         │   └──────────────┬─────────────────────┘
└──────────────────────┘                  │
                                          ▼
                             ┌────────────────────────────────────┐
                             │  Delta Bronze (append-only stream) │
                             │  Downstream: 5-min batch job       │
                             │  Aggregates → Silver → Gold        │
                             └────────────────────────────────────┘
```

**Key design decisions made:**
- Fraud detection uses Azure Stream Analytics (< 2 second latency requirement — Flink-level)
- Analytics pipeline uses Databricks micro-batch (30-second trigger — good enough for dashboards)
- Separation of fraud and analytics consumers — fraud latency requirement doesn't constrain analytics

**Trade-offs accepted:**
- Always-on clusters (fraud detection + streaming analytics) — expensive but required
- Eventual consistency on order status (30-second delay) — acceptable to business

**What could go wrong:**
- Event Hub partition hot-spot: all orders from same customer → same partition → one consumer overloaded. Fix: partition key = hash(customer_id) to distribute
- Checkpoint corrupted: streaming job falls back to `latest` offset → missed events. Fix: backup checkpoint directory, monitor checkpoint lag

---

## Architecture 3: Hybrid Batch + CDC

**The scenario:** Financial services firm. Need near-real-time reconciliation data (15-minute latency) AND daily corrections from batch reprocessing. Regulatory requirement: no data loss.

```
┌────────────────────────────────────────────────────────────────────────┐
│  SOURCE: Core Banking System (SQL Server)                               │
└──────────────────────┬─────────────────────────────────────────────────┘
                       │
          ┌────────────┴──────────────────────┐
          │                                   │
          ▼                                   ▼
┌──────────────────────┐         ┌────────────────────────────────┐
│  CDC STREAM          │         │  DAILY BATCH (ADF)             │
│  Debezium → Kafka    │         │  Full extract for corrections  │
│  → Databricks Stream │         │  Runs at 02:00 UTC             │
│  → Delta Bronze      │         │  → Delta Bronze (separate path)│
│  (15-min latency)    │         │                                │
└──────────┬───────────┘         └───────────────┬────────────────┘
           │                                     │
           └─────────────────┬───────────────────┘
                             │
                             ▼
                  ┌──────────────────────────────┐
                  │  Silver MERGE Job            │
                  │  (every 15 min for CDC)      │
                  │  (daily for batch corr.)     │
                  │  MERGE handles dedup         │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Gold: fact_transactions      │
                  │  (regulatory reporting)       │
                  │  Audit log: every MERGE       │
                  │  operation logged             │
                  └──────────────────────────────┘
```

**Key design decisions made:**
- Dual write paths (CDC + batch) for resilience — if CDC falls behind, daily batch catches up and corrects
- MERGE for both paths — idempotent, no duplicates regardless of which path delivered the record first
- Full audit log — regulatory requirement. Every MERGE operation logged with version, operator, record count

**Trade-offs accepted:**
- More complex architecture (two ingestion paths) vs simpler CDC-only
- Batch corrections arrive with 24-hour latency — accepted because CDC provides the 15-min window for operational use
- Higher infrastructure cost (CDC always-on + daily batch) vs streaming-only

**What could go wrong:**
- CDC connector falls behind during high-volume trading hours. Fix: Kafka consumer lag alerting, auto-scale Debezium workers
- Batch and CDC produce conflicting values for same record (source correction arrives before CDC event). Fix: MERGE condition checks `updated_at` timestamp — latest wins

---

## Lessons Across All Three

1. **Latency requirement drives everything.** Don't build streaming because you can — build it because you need it.
2. **Idempotency prevents emergencies.** Every pipeline failure becomes routine if re-running is safe.
3. **Governance is not an afterthought.** Unity Catalog from day one, not retrofitted 18 months later.
4. **Design for the failure, not the happy path.** Every architecture decision should include "what happens when X fails?"
5. **Separate processing layers.** Bronze → Silver → Gold. Each layer's processing is independent, debuggable, and re-runnable.
