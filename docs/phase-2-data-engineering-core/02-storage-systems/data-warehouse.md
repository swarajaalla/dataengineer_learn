---
sidebar_position: 1
---

# Data Warehouse

A data warehouse is a central repository of structured, historical data optimized for analytical queries — not transactions.

---

## What It Is

A warehouse stores data that has been cleaned, transformed, and organized for reporting. It answers "What was our revenue by region in Q3?" — not "Insert this order."

Key traits:
- **Subject-oriented** — organized by business domain (sales, finance, supply chain)
- **Non-volatile** — data is never deleted, only appended (history is preserved)
- **Time-variant** — every record has a time dimension
- **Integrated** — multiple source systems merged into one consistent view

---

## What It Is NOT

- It's **not** a place to dump raw data (that's a data lake)
- It's **not** a transactional database (don't write applications against it)
- It's **not** a reporting tool (Power BI, Tableau are separate)
- It's **not** where you store semi-structured or unstructured data

---

## Modern Cloud Warehouses

| Warehouse | Cloud | Key Differentiator | Azure integration |
|-----------|-------|-------------------|------------------|
| **Snowflake** | Multi-cloud | Auto-scaling, zero-copy clone, time travel | Works on Azure, connects to ADF |
| **Azure Synapse** | Azure | Integrated with ADF, ADLS, Databricks | Native |
| **BigQuery** | GCP | Serverless, no cluster, pay per TB scanned | — |
| **Databricks SQL** | Multi-cloud | Delta Lake native, photon engine | Strong Azure integration |
| **Amazon Redshift** | AWS | Tight S3 integration, Spectrum for lake queries | — |

---

## Key Warehouse Features

**Columnar storage** — data stored column-by-column, not row-by-row. Reads only the columns your query needs.

```sql
-- Without columnar: reads all 50 columns even though you need 3
SELECT year, region, SUM(revenue)
FROM fact_sales
GROUP BY year, region
-- With columnar: only reads year, region, revenue columns — 10x faster
```

**Partitioning** — physically splits data by a column (usually date). Queries with date filters skip irrelevant partitions.

**Clustering / Distribution** — rows with similar values co-located on the same node. Reduces shuffle for joins.

**Materialized Views** — pre-computed query results stored as tables. Queries against them skip recomputation.

---

## Synapse Analytics: Dedicated vs Serverless

**Dedicated SQL Pool (formerly DWU):**
- Reserved capacity, always running, pay per hour
- Best for: high-concurrency BI, consistent performance SLAs
- Weakness: expensive when idle

**Serverless SQL Pool:**
- No provisioning, pay per TB queried
- Best for: ad-hoc exploration of ADLS files (Parquet, Delta, CSV)
- Weakness: slower than dedicated for repeated queries

```sql
-- Synapse Serverless — query Parquet in ADLS without loading
SELECT region, SUM(revenue)
FROM OPENROWSET(
    BULK 'https://myaccount.dfs.core.windows.net/gold/fact_sales/**',
    FORMAT = 'PARQUET'
) AS data
GROUP BY region;
```

---

## Cost Model for Cloud Warehouses

| Model | Charged for | Best when |
|-------|------------|-----------|
| **Compute + Storage** (Snowflake, Synapse Dedicated) | Cluster time + storage separately | Predictable workloads |
| **Pay per query** (BigQuery, Synapse Serverless, Athena) | TB scanned per query | Intermittent queries |
| **DBU-based** (Databricks SQL) | Databricks Units per second | Mixed workloads |

---

## When to Use a Warehouse vs Lakehouse

Use a **warehouse** when:
- All data is structured and modeled
- Team is SQL-focused, no ML/Python workloads
- You need consistent query performance for BI dashboards
- Data volume is under ~100 TB

Use a **lakehouse** (Databricks + Delta Lake) when:
- Mix of structured and semi-structured data
- Both ML and BI on same platform
- Large volumes (hundreds of TB+)
- Need raw data preserved + analytics
- Want to avoid data duplication between lake and warehouse

---

## Real Use Case: Finance Reporting

```
Requirement: CFO dashboard showing 5 years of revenue by product, region, salesperson
- 500M rows in fact_sales
- 50 concurrent analysts querying daily
- Data refreshed nightly

Solution: Databricks SQL Warehouse (medium cluster, auto-stop)
- Delta Gold table: fact_sales partitioned by year/month
- Z-Order on region + product_category (common filter columns)
- Power BI connects via partner connect
- Query time: 3–8 seconds on 500M rows
```
