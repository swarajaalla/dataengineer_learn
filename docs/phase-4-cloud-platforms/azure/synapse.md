---
sidebar_position: 3
---

# Azure Synapse Analytics

Synapse is Microsoft's unified analytics platform — it combines a serverless SQL engine, dedicated SQL pools (data warehouse), and Spark all in one workspace.

---

## What It Is (and Isn't)

Synapse is NOT a replacement for Databricks. Think of it as a workspace that bundles:

| Component | What it does |
|-----------|-------------|
| **Serverless SQL Pool** | Query files in ADLS directly — no cluster needed |
| **Dedicated SQL Pool** | Traditional data warehouse (MPP), billed by DWU |
| **Spark Pool** | Apache Spark clusters, similar to Databricks |
| **Synapse Pipelines** | ADF-equivalent, same UI and connectors |
| **Synapse Link** | Real-time analytical queries on Cosmos DB / Dataverse |

---

## Serverless SQL Pool — The Most Useful Part

Query Parquet/Delta files in ADLS without loading data:

```sql
-- Query Parquet directly from ADLS
SELECT
    order_date,
    SUM(amount) AS total_revenue
FROM OPENROWSET(
    BULK 'https://mystorageaccount.dfs.core.windows.net/silver/orders/**',
    FORMAT = 'PARQUET'
) AS result
GROUP BY order_date
ORDER BY order_date;

-- Create a view over external files
CREATE VIEW silver.vw_orders AS
SELECT *
FROM OPENROWSET(
    BULK 'https://mystorageaccount.dfs.core.windows.net/silver/orders/',
    FORMAT = 'DELTA'
) AS result;
```

Pay only per TB scanned — no cluster to manage.

---

## Dedicated SQL Pool (Data Warehouse)

For high-performance reporting on structured Gold layer data:

```sql
-- Create an external table pointing to ADLS
CREATE EXTERNAL TABLE gold.fact_sales (
    sale_id     INT,
    customer_id INT,
    sale_date   DATE,
    amount      DECIMAL(18,2)
)
WITH (
    LOCATION = '/gold/fact_sales/',
    DATA_SOURCE = adls_data_source,
    FILE_FORMAT = parquet_format
);

-- Distribution strategy (critical for performance)
CREATE TABLE gold.fact_sales_local
WITH (DISTRIBUTION = HASH(customer_id), CLUSTERED COLUMNSTORE INDEX)
AS SELECT * FROM gold.fact_sales;
```

**Distribution options:**
- `HASH(col)` — spread rows by column value, ideal for joins on that column
- `ROUND_ROBIN` — even spread, good for staging tables
- `REPLICATE` — copy to every node, ideal for small dimension tables

---

## When to Use Synapse vs Databricks

| Scenario | Use |
|----------|-----|
| Ad-hoc SQL on ADLS files | Synapse Serverless SQL |
| Complex Spark transformations | Databricks |
| Traditional DWH with Power BI | Synapse Dedicated Pool |
| ML / data science | Databricks |
| Real-time Cosmos DB analytics | Synapse Link |
| Existing ADF pipelines | Synapse Pipelines (same thing) |

---

## Best Practices

- Use **Serverless SQL** for exploration and lightweight reporting — it's free until you query
- Use **Dedicated Pool** only if you have strict SLA requirements for a DWH workload
- Pause Dedicated Pools when not in use (they bill by the hour even when idle)
- Use Managed Private Endpoints to keep all traffic inside the VNet
