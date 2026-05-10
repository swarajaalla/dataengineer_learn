---
sidebar_position: 2
---

# Google BigQuery

BigQuery is GCP's serverless data warehouse — no clusters to manage, instant scaling, and SQL-first. It's one of the most capable cloud DWH services and is unique in that storage and compute are completely separated.

---

## What Makes BigQuery Different

- **Serverless** — no cluster, no DWU to configure. Query runs, you pay per TB scanned
- **Columnar storage** — Capacitor format, automatically compressed and encoded
- **Dremel execution** — massively parallel SQL, petabyte-scale in seconds
- **Separation of storage and compute** — your data in BigQuery storage, compute scales independently

---

## Core Concepts

```
Project (my-gcp-project)
    └── Dataset (gold)           ← like a schema/database
        └── Table (fact_sales)   ← standard table
        └── View (vw_monthly)    ← saved query
        └── Materialized View    ← pre-computed, auto-refreshed
        └── External Table       ← points to GCS, not stored in BQ
```

---

## SQL in BigQuery

BigQuery uses standard SQL with a few GCP-specific extensions:

```sql
-- Partitioned query — only scans relevant partitions (much cheaper)
SELECT
    DATE(order_ts) AS order_date,
    region,
    SUM(amount) AS revenue
FROM `my-project.silver.orders`
WHERE DATE(order_ts) BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY 1, 2;

-- Window function — running total by region
SELECT
    order_date,
    region,
    revenue,
    SUM(revenue) OVER (PARTITION BY region ORDER BY order_date) AS running_total
FROM `my-project.gold.daily_revenue`;

-- MERGE (upsert) — Delta-style in BigQuery
MERGE `my-project.gold.customers` AS target
USING `my-project.silver.customer_updates` AS source
ON target.customer_id = source.customer_id
WHEN MATCHED THEN
    UPDATE SET target.email = source.email, target.updated_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN
    INSERT (customer_id, email, created_at) VALUES (source.customer_id, source.email, CURRENT_TIMESTAMP());
```

---

## Partitioning & Clustering (Critical for Cost + Performance)

```sql
-- Partitioned by ingestion date (automatic)
CREATE TABLE gold.fact_sales
PARTITION BY DATE(_PARTITIONTIME)
AS SELECT * FROM silver.orders;

-- Partitioned by a column + clustered (best pattern)
CREATE TABLE gold.fact_sales (
    sale_id     INT64,
    sale_date   DATE,
    region      STRING,
    customer_id INT64,
    amount      NUMERIC
)
PARTITION BY sale_date
CLUSTER BY region, customer_id;
```

- **Partition pruning** — BigQuery skips partitions not matching the WHERE clause → less data scanned → cheaper
- **Clustering** — physically co-locates similar rows → faster GROUP BY and filter on cluster columns

---

## External Tables — Query GCS Without Loading

```sql
-- Create external table pointing to GCS Parquet files
CREATE EXTERNAL TABLE silver.raw_orders
OPTIONS (
    format = 'PARQUET',
    uris = ['gs://my-data-lake/silver/orders/*.parquet']
);

-- Or use BigLake for fine-grained access control on GCS files
CREATE EXTERNAL TABLE silver.orders_biglake
WITH CONNECTION `my-project.us.my-connection`
OPTIONS (
    format = 'PARQUET',
    uris = ['gs://my-data-lake/silver/orders/*']
);
```

---

## Loading Data from GCS

```python
from google.cloud import bigquery

client = bigquery.Client()

job_config = bigquery.LoadJobConfig(
    source_format=bigquery.SourceFormat.PARQUET,
    write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
    schema_update_options=[bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION],
)

load_job = client.load_table_from_uri(
    "gs://my-data-lake/silver/orders/dt=2024-01-15/*.parquet",
    "my-project.gold.fact_sales",
    job_config=job_config,
)
load_job.result()  # Wait for completion
```

---

## Cost Control

- **On-demand pricing** — $5 per TB scanned. Use partitions + clusters to minimize scans
- **Capacity pricing** — flat rate slots for predictable high-volume workloads
- Use `SELECT specific_columns` not `SELECT *` — BQ scans all columns you reference
- Preview data with `LIMIT 10` before running full aggregations
- Use **materialized views** for expensive repeated queries

---

## BigQuery vs Redshift vs Synapse

| Factor | BigQuery | Redshift | Synapse |
|--------|----------|----------|---------|
| Cluster management | None (serverless) | Yes | Yes (pause/resume) |
| Pricing model | Per TB scanned | Per node-hour | Per DWU-hour |
| Scaling | Instant | Manual resize | Manual resize |
| Best SQL dialect | Standard SQL | PostgreSQL | T-SQL |
| Native ML | Yes (BigQuery ML) | Limited | Limited |
