---
sidebar_position: 5
---

# Snowflake Certifications

Snowflake offers a tiered certification program. For data engineers, the **SnowPro Core** is the foundation, and the **SnowPro Advanced: Data Engineer** goes deeper into pipeline design and performance.

---

## Certification Tiers

```
SnowPro Core                    ← Start here (all roles)
    ↓
SnowPro Advanced: Data Engineer ← DE-specific depth
SnowPro Advanced: Architect
SnowPro Advanced: Data Scientist
```

---

## SnowPro Core Certification

### What It Covers

| Domain | Weight |
|--------|--------|
| Snowflake Cloud Data Platform features | 25% |
| Account access and security | 15% |
| Performance concepts | 15% |
| Data loading and unloading | 10% |
| Data transformations | 20% |
| Data protection and data sharing | 15% |

### Exam Format

- Duration: 115 minutes
- Questions: 100 multiple choice
- Passing score: 750/1000
- Cost: $175 USD
- Valid for: 2 years

### Key Topics

**Virtual Warehouses:**
```sql
-- Create a warehouse sized for BI queries
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 300          -- suspend after 5 min idle
    AUTO_RESUME = TRUE
    INITIALLY_SUSPENDED = TRUE;

-- Scale up for large batch loads
ALTER WAREHOUSE etl_wh SET WAREHOUSE_SIZE = 'LARGE';

-- Multi-cluster for high concurrency
ALTER WAREHOUSE analytics_wh SET
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 3
    SCALING_POLICY = 'ECONOMY';
```

**Data Loading:**
```sql
-- Create a stage pointing to S3
CREATE STAGE my_s3_stage
    URL = 's3://my-bucket/data/'
    CREDENTIALS = (AWS_ROLE = 'arn:aws:iam::123:role/SnowflakeRole');

-- COPY INTO from stage
COPY INTO silver.orders
FROM @my_s3_stage/orders/
FILE_FORMAT = (TYPE = 'PARQUET')
ON_ERROR = 'CONTINUE';

-- Load status
SELECT * FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'ORDERS',
    START_TIME => DATEADD(hours, -1, CURRENT_TIMESTAMP())
));
```

**Time Travel and Cloning:**
```sql
-- Query historical data
SELECT * FROM silver.orders AT (VERSION => 10);
SELECT * FROM silver.orders AT (TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP);

-- Restore dropped table
UNDROP TABLE silver.orders;

-- Zero-copy clone (instant, no storage cost initially)
CREATE TABLE silver.orders_backup CLONE silver.orders;
CREATE DATABASE dev_db CLONE prod_db;
```

**Commonly Tested:**
- Micro-partition size (50–500MB compressed) and clustering
- Credit consumption — warehouse size doubles credits (XS=1, S=2, M=4, L=8...)
- Snowpipe — continuous ingest via S3/Azure event notifications
- Streams — track DML changes on a table (equivalent to CDC)
- Tasks — scheduled SQL execution (like a cron for Snowflake)

---

## SnowPro Advanced: Data Engineer

### What It Covers

| Domain | Weight |
|--------|--------|
| Data movement | 25% |
| Performance optimization | 25% |
| Storage and data protection | 20% |
| Security | 20% |
| Data sharing and collaboration | 10% |

### Key Advanced Topics

**Streams + Tasks (CDC in Snowflake):**
```sql
-- Stream tracks changes to source table
CREATE STREAM orders_stream ON TABLE bronze.raw_orders;

-- Task processes the stream on a schedule
CREATE TASK process_orders_stream
    WAREHOUSE = etl_wh
    SCHEDULE = 'USING CRON 0 * * * * UTC'   -- hourly
AS
    MERGE INTO silver.orders AS t
    USING orders_stream AS s ON t.order_id = s.order_id
    WHEN MATCHED AND s.METADATA$ACTION = 'INSERT' THEN UPDATE SET *
    WHEN NOT MATCHED AND s.METADATA$ACTION = 'INSERT' THEN INSERT *;

ALTER TASK process_orders_stream RESUME;
```

**Clustering Keys — Performance Optimization:**
```sql
-- Add clustering key on frequently-filtered column
ALTER TABLE silver.orders CLUSTER BY (order_date, region);

-- Check clustering depth (lower = better)
SELECT SYSTEM$CLUSTERING_INFORMATION('silver.orders', '(order_date, region)');

-- Manual recluster (automatic clustering handles this in production)
ALTER TABLE silver.orders RECLUSTER;
```

### Exam Format

- Duration: 115 minutes
- Questions: 100 multiple choice
- Passing score: 750/1000
- Cost: $375 USD (more expensive — study well)
- Prerequisite: SnowPro Core recommended

### Study Resources

| Resource | Cost | Notes |
|----------|------|-------|
| Snowflake free trial (30 days) | Free | Hands-on is essential |
| Snowflake documentation | Free | Best reference — read the Core concepts section |
| Udemy (Snowflake courses — multiple authors) | ~$15 | Good for structured video learning |
| Official SnowPro study guides | Free (on certification page) | Domain-by-domain breakdown |
| Snowflake community forums | Free | Real exam experience shared |
