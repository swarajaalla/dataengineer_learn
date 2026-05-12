---
sidebar_position: 6
---

# Azure Synapse Analytics

Azure Synapse Analytics is Microsoft’s unified analytics platform that combines:
- Data warehousing
- Big data analytics
- Serverless SQL
- Spark processing
- Data integration
- Real-time analytics

inside a single workspace.

Synapse integrates tightly with:
- ADLS Gen2
- Azure Data Factory
- Power BI
- Databricks
- Delta Lake

---

# Why Synapse?

Synapse is mainly used for:
- Enterprise reporting
- SQL analytics
- Ad-hoc querying
- Data warehousing
- Interactive BI workloads
- Querying data lakes
- Hybrid analytical workloads

---

# Core Components

| Component | Purpose |
|---|---|
| Serverless SQL Pool | Query files directly from ADLS |
| Dedicated SQL Pool | Enterprise MPP data warehouse |
| Spark Pool | Spark-based processing |
| Synapse Pipelines | Data integration/orchestration |
| Synapse Studio | Unified development workspace |
| Synapse Link | Near real-time analytics on operational databases |

---

# Synapse Architecture

```text
Data Sources
      ↓
ADLS Gen2
      ↓
Synapse Workspace
      ├── Serverless SQL
      ├── Dedicated SQL Pool
      ├── Spark Pool
      └── Pipelines
      ↓
Power BI / Reporting / Analytics
```

---

# Synapse Studio

Web-based unified development interface.

Used for:
- SQL development
- Spark notebooks
- Pipeline creation
- Monitoring
- Data exploration

Single workspace for:
- Data engineers
- Analysts
- Data scientists

---

# Serverless SQL Pool

Most commonly used Synapse feature.

Allows querying files directly from ADLS without:
- Loading data
- Managing clusters
- Creating tables first

---

# Why Serverless SQL?

Advantages:
- Pay-per-query model
- No infrastructure management
- Great for ad-hoc analytics
- Fast exploration
- Works directly on data lake files

---

# Query Parquet Files

```sql
SELECT
    order_date,
    SUM(amount) AS total_revenue
FROM OPENROWSET(
    BULK 'https://mystorageaccount.dfs.core.windows.net/silver/orders/**',
    FORMAT = 'PARQUET'
) AS result
GROUP BY order_date
ORDER BY order_date;
```

---

# Query Delta Lake

```sql
SELECT *
FROM OPENROWSET(
    BULK 'https://mystorageaccount.dfs.core.windows.net/silver/orders/',
    FORMAT = 'DELTA'
) AS result;
```

---

# Create External View

```sql
CREATE VIEW silver.vw_orders AS
SELECT *
FROM OPENROWSET(
    BULK 'https://mystorageaccount.dfs.core.windows.net/silver/orders/',
    FORMAT = 'PARQUET'
) AS result;
```

---

# OPENROWSET

Used to read external files directly.

Supports:
- Parquet
- CSV
- Delta
- JSON

Common use cases:
- Quick analytics
- Reporting
- Data validation
- Lightweight exploration

---

# Dedicated SQL Pool

Enterprise MPP (Massively Parallel Processing) data warehouse.

Designed for:
- Large-scale reporting
- Power BI dashboards
- Enterprise BI workloads
- Structured analytics

---

# Dedicated Pool Architecture

```text
Control Node
      ↓
Compute Nodes
      ↓
Distributed Storage
```

Data is distributed across multiple compute nodes for parallel execution.

---

# Distribution Types

Critical for performance optimization.

| Distribution Type | Usage |
|---|---|
| HASH(column) | Best for joins on large tables |
| ROUND_ROBIN | Fast load/staging tables |
| REPLICATE | Small dimension tables |

---

# HASH Distribution

Rows distributed based on column hash.

Best for:
- Large fact tables
- Frequent joins

Example:

```sql
CREATE TABLE fact_sales
WITH (
    DISTRIBUTION = HASH(customer_id)
)
AS
SELECT * FROM source_table;
```

---

# ROUND_ROBIN Distribution

Evenly distributes rows across nodes.

Best for:
- Staging tables
- Temporary loads

Simple but less optimized for joins.

---

# REPLICATE Distribution

Copies small tables to all nodes.

Best for:
- Small dimension/reference tables

Improves join performance.

---

# Columnstore Index

Dedicated pools use:
```text
CLUSTERED COLUMNSTORE INDEX
```

Advantages:
- Compression
- Faster analytics
- Reduced storage
- Better scan performance

Best for:
- Large analytical tables

---

# External Tables

Point SQL tables directly to ADLS files.

Example:

```sql
CREATE EXTERNAL TABLE gold.fact_sales (
    sale_id INT,
    customer_id INT,
    amount DECIMAL(18,2)
)
WITH (
    LOCATION = '/gold/fact_sales/',
    DATA_SOURCE = adls_data_source,
    FILE_FORMAT = parquet_format
);
```

---

# CETAS (Create External Table As Select)

Used to:
- Export query results to ADLS
- Improve performance
- Materialize datasets

Example:

```sql
CREATE EXTERNAL TABLE gold.sales_summary
WITH (
    LOCATION = '/gold/sales_summary/',
    DATA_SOURCE = adls_data_source,
    FILE_FORMAT = parquet_format
)
AS
SELECT customer_id, SUM(amount) total_sales
FROM gold.fact_sales
GROUP BY customer_id;
```

---

# Spark Pool

Synapse includes Apache Spark clusters.

Used for:
- Data engineering
- ETL processing
- Machine learning
- Data transformations

Supports:
- PySpark
- Scala
- Spark SQL

---

# Synapse Spark vs Databricks

| Feature | Synapse Spark | Databricks |
|---|---|---|
| Ease of Use | Moderate | Excellent |
| Performance | Good | Better optimization |
| Collaboration | Basic | Advanced |
| Delta Support | Good | Native |
| ML Ecosystem | Limited | Strong |
| Enterprise Adoption | Moderate | High |

---

# Real-World Guidance

Use:
- Databricks for heavy Spark engineering
- Synapse Serverless for SQL analytics
- Dedicated Pool for enterprise BI

Avoid forcing Synapse Spark to replace Databricks entirely.

---

# Synapse Pipelines

Same engine as Azure Data Factory.

Supports:
- Copy Activity
- Triggers
- Data movement
- Orchestration

Good for:
- Unified Synapse workflows

---

# Synapse Link

Provides near real-time analytics on:
- Cosmos DB
- Dataverse

Without ETL movement.

Used for:
- Operational analytics
- Near real-time reporting

---

# Synapse Security

## Managed Identity
Preferred authentication method.

---

## RBAC
Role-based access control.

---

## Managed Private Endpoints
Private connectivity to:
- ADLS
- SQL databases
- Cosmos DB

---

## Encryption
Supports:
- Encryption at rest
- Encryption in transit

---

# Synapse Networking

Best practice:
Use:
- Private endpoints
- VNets
- Firewall restrictions

Avoid exposing Synapse publicly.

---

# Performance Optimization

## Serverless SQL Best Practices
- Use Parquet/Delta
- Partition files
- Avoid scanning unnecessary data
- Use views for abstraction

---

## Dedicated Pool Best Practices
- Choose proper distribution strategy
- Use columnstore indexes
- Avoid small transactions
- Partition large tables

---

# Cost Optimization

## Serverless SQL
Charged per TB scanned.

Reduce cost by:
- Partition pruning
- Using Parquet
- Compressing data

---

## Dedicated Pool
Charged continuously while running.

Important:
Pause dedicated pools when not in use.

---

# Synapse vs Databricks

| Scenario | Recommended Tool |
|---|---|
| Heavy Spark ETL | Databricks |
| ML/Data Science | Databricks |
| Ad-hoc SQL on ADLS | Synapse Serverless |
| Enterprise DWH | Synapse Dedicated Pool |
| Interactive BI | Synapse |
| Delta Engineering | Databricks |
| Near Real-Time Cosmos Analytics | Synapse Link |

---

# Common Enterprise Architecture

```text
SAP / APIs / Databases
            ↓
ADF / Synapse Pipelines
            ↓
ADLS Bronze
            ↓
Databricks Transformations
            ↓
ADLS Silver / Gold
            ↓
Synapse Serverless SQL
            ↓
Power BI Dashboards
```

---

# Common Interview Questions

## Difference Between Serverless and Dedicated SQL Pool

| Serverless | Dedicated |
|---|---|
| Query external files | Stores warehouse data |
| Pay per query | Dedicated compute billing |
| No infrastructure | MPP warehouse |
| Best for exploration | Best for enterprise BI |

---

## Why Use HASH Distribution?

Improves:
- Join performance
- Parallel execution

Especially for large fact tables.

---

## Why Use Parquet with Synapse?

Advantages:
- Compression
- Faster scans
- Lower query cost
- Columnar storage

---

## When Should Dedicated Pool Be Used?

Use only when:
- Strict SLA requirements exist
- High concurrency BI workloads
- Enterprise warehouse scenarios

Otherwise serverless is often sufficient.

---

# Best Practices

- Use Serverless SQL for lightweight analytics
- Use Databricks for complex Spark transformations
- Use Dedicated Pools only when truly needed
- Pause Dedicated Pools when idle
- Use Managed Private Endpoints
- Store data in Parquet/Delta
- Partition large datasets
- Optimize distributions carefully

---

# Key Takeaways

- Synapse is a unified analytics platform.
- Serverless SQL is the most widely useful feature.
- Dedicated SQL Pool is an enterprise MPP warehouse.
- Synapse integrates tightly with ADLS and Power BI.
- Databricks is still preferred for advanced Spark engineering.
- Distribution strategy is critical for Dedicated Pool performance.
- Serverless SQL enables analytics directly on the data lake.