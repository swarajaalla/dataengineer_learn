---
sidebar_position: 1
---

# Snowflake Architecture

Snowflake is a cloud-native data warehouse with a unique architecture that separates compute from storage. Used widely in analytics-first stacks.

---

## What Makes Snowflake Different

Unlike traditional data warehouses (where compute and storage are tightly coupled), Snowflake has three fully separated layers:

```
Storage Layer       → S3/ADLS/GCS — compressed columnar files
Compute Layer       → Virtual Warehouses — independent, scalable
Cloud Services      → Metadata, query optimization, security
```

This separation allows:
- Scale storage independently from compute
- Run multiple workloads simultaneously on the same data
- Pay only for compute while queries run

---

## Virtual Warehouses

A Virtual Warehouse is a cluster of compute nodes. It's what actually runs your queries.

```sql
-- Create a warehouse
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'MEDIUM'   -- XS, S, M, L, XL, 2XL...
    AUTO_SUSPEND = 300          -- suspend after 5 min idle
    AUTO_RESUME = TRUE;

-- Use a specific warehouse for a session
USE WAREHOUSE analytics_wh;
```

Key behaviors:
- **Auto-suspend** — warehouse pauses when idle, no cost
- **Auto-resume** — starts automatically when a query arrives
- **Multi-cluster** — scale out for concurrent users (not for single large queries)

---

## Databases, Schemas, Tables

```sql
-- Hierarchy
CREATE DATABASE prod;
USE DATABASE prod;

CREATE SCHEMA silver;
USE SCHEMA silver;

CREATE TABLE orders (
    order_id    VARCHAR(50)    NOT NULL,
    customer_id VARCHAR(50),
    amount      NUMBER(18,2),
    order_date  DATE,
    status      VARCHAR(20)
);
```

---

## Time Travel

Query historical versions of data — similar to Delta Lake's time travel.

```sql
-- Query 1 hour ago
SELECT * FROM orders AT (OFFSET => -3600);

-- Query a specific timestamp
SELECT * FROM orders AT (TIMESTAMP => '2024-01-15 08:00:00'::TIMESTAMP_TZ);

-- Query a specific statement ID
SELECT * FROM orders BEFORE (STATEMENT => 'statement_id');

-- Undrop a table
UNDROP TABLE orders;
```

Default retention: 1 day (Enterprise: up to 90 days).

---

## Zero-Copy Cloning

Create an instant copy of a table, schema, or database without copying data.

```sql
-- Clone a table for testing (instant, no storage cost until modified)
CREATE TABLE orders_test CLONE orders;

-- Clone a schema
CREATE SCHEMA dev CLONE prod;

-- Great for: dev environments, backup before a bulk update
ALTER TABLE orders_test
SET DATA RETENTION_TIME_IN_DAYS = 7;
```

---

## Snowpipe (Continuous Ingestion)

Automatically load files as they arrive in cloud storage.

```sql
CREATE PIPE orders_pipe
    AUTO_INGEST = TRUE
AS COPY INTO orders
FROM @my_s3_stage/orders/
FILE_FORMAT = (TYPE = 'PARQUET');
```

Configure an SNS/Event Grid notification on the storage bucket — Snowpipe is triggered automatically on new file arrivals.

---

## Streams and Tasks (CDC + Scheduling)

Streams track changes (inserts, updates, deletes) to a table:

```sql
CREATE STREAM orders_stream ON TABLE orders;

-- After changes happen:
SELECT * FROM orders_stream WHERE METADATA$ACTION = 'INSERT';
```

Tasks schedule SQL or procedures:

```sql
CREATE TASK process_orders
    WAREHOUSE = analytics_wh
    SCHEDULE = 'USING CRON 0 6 * * * UTC'
AS
MERGE INTO silver.orders AS t
USING orders_stream AS s ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

---

## Snowflake vs Databricks

| | Snowflake | Databricks |
|--|-----------|-----------|
| **Primary use** | SQL analytics, BI | ML, ETL, unified analytics |
| **Language** | SQL-first | Python/SQL/Scala |
| **Streaming** | Limited (Snowpipe) | Full (Structured Streaming) |
| **ML** | Via Snowpark (Python) | Native (MLflow, Spark ML) |
| **Cost model** | Credits per compute second | DBU per node-hour |
| **Best for** | SQL teams, BI-heavy | Data science + engineering |
