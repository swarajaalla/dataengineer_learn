---
sidebar_position: 4
---

# Amazon Redshift

Redshift is AWS's cloud data warehouse — the equivalent of Synapse Dedicated Pool or Snowflake. Use it as the Gold layer for structured, high-performance analytical queries.

---

## Architecture

Redshift uses MPP (Massively Parallel Processing) — a leader node distributes queries across multiple compute nodes:

```
Leader Node
    ├── Compute Node 1 (slice 1 + slice 2)
    ├── Compute Node 2 (slice 3 + slice 4)
    └── Compute Node 3 (slice 5 + slice 6)
```

Each compute node stores a slice of data. Queries run in parallel across all nodes.

---

## Table Design (Critical for Performance)

### Distribution Style

How rows are spread across nodes — wrong choice causes data skew and slow joins:

```sql
-- EVEN: round-robin, good for staging tables with no join key
CREATE TABLE staging.raw_events DISTSTYLE EVEN (...);

-- KEY: rows with same key land on same node — fast joins
CREATE TABLE gold.fact_sales DISTKEY(customer_id) (...);

-- ALL: full copy on every node — for small dimension tables
CREATE TABLE gold.dim_date DISTSTYLE ALL (...);
```

### Sort Key

Controls physical row order on disk — speeds up range filters and GROUP BY:

```sql
-- Compound sort key — filter frequently on order_date then region
CREATE TABLE gold.fact_sales (
    sale_id     BIGINT,
    customer_id INT,
    order_date  DATE,
    region      VARCHAR(50),
    amount      DECIMAL(18,2)
)
DISTKEY(customer_id)
SORTKEY(order_date, region);
```

---

## Loading Data from S3 (COPY Command)

COPY is the fastest way to load data — parallel load from S3:

```sql
-- Load Parquet from S3 into Redshift
COPY gold.fact_sales
FROM 's3://my-data-lake/gold/fact_sales/'
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftS3Role'
FORMAT AS PARQUET;

-- Load CSV with options
COPY staging.raw_orders
FROM 's3://my-data-lake/raw/orders/2024/01/'
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftS3Role'
CSV
IGNOREHEADER 1
DATEFORMAT 'YYYY-MM-DD'
EMPTYASNULL;
```

---

## Redshift Spectrum — Query S3 Directly

Spectrum lets Redshift query files in S3 without loading them, using Glue Catalog:

```sql
-- Create external schema pointing to Glue Catalog
CREATE EXTERNAL SCHEMA silver
FROM DATA CATALOG
DATABASE 'silver'
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftSpectrumRole'
CREATE EXTERNAL DATABASE IF NOT EXISTS;

-- Join Redshift table with S3 data in one query
SELECT
    r.customer_id,
    r.region,
    SUM(s.amount) AS total_spent
FROM gold.fact_sales r  -- Redshift table (fast)
JOIN silver.orders s     -- S3 via Spectrum (flexible)
    ON r.sale_id = s.order_id
GROUP BY 1, 2;
```

---

## Maintenance

```sql
-- VACUUM: reclaim space from deleted rows and re-sort
VACUUM gold.fact_sales;
VACUUM gold.fact_sales TO 75 PERCENT;  -- partial vacuum, faster

-- ANALYZE: update table statistics for query optimizer
ANALYZE gold.fact_sales;

-- Check table stats
SELECT * FROM svv_table_info WHERE "table" = 'fact_sales';

-- Check query performance
SELECT query, substring(querytxt, 1, 80), elapsed
FROM stl_query
ORDER BY elapsed DESC
LIMIT 10;
```

---

## Redshift vs Snowflake vs Synapse

| Factor | Redshift | Snowflake | Synapse Dedicated |
|--------|----------|-----------|-------------------|
| Pricing | Per node-hour | Per credit (compute + storage separate) | Per DWU-hour |
| Scaling | Manual resize | Instant scale up/down | Manual resize |
| Concurrency | Good | Excellent (multi-cluster) | Good |
| S3 integration | Native (COPY, Spectrum) | Via Snowpipe / external stage | Via PolyBase |
| Best for | AWS-native analytics | Multi-cloud, high concurrency | Azure-native analytics |
