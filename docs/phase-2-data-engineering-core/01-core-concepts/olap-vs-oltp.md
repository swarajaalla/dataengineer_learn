---
sidebar_position: 5
---

# OLAP vs OLTP

OLTP and OLAP are two fundamentally different ways data is stored and accessed. Every data pipeline moves data from one to the other.

---

## OLTP — Online Transaction Processing

Runs the business. Built for fast, frequent, small reads and writes.

- **Examples:** SAP ERP, Dynamics 365, Salesforce, e-commerce order systems, banking platforms
- **Schema:** Normalized (3NF) — data split across many tables to avoid duplication
- **Operations:** `INSERT`, `UPDATE`, `DELETE`, point lookups (`WHERE id = 123`)
- **Users:** Applications, not humans — thousands of concurrent writes per second
- **Data volume:** Current state only — old data is overwritten or archived

```sql
-- OLTP query — fast, simple, indexed
SELECT * FROM orders WHERE order_id = 'ORD-123456';

-- OLTP insert — fast, single row
INSERT INTO order_items (order_id, sku, qty, price) VALUES ('ORD-123456', 'SKU-001', 2, 49.99);
```

---

## OLAP — Online Analytical Processing

Analyzes the business. Built for complex queries across large historical datasets.

- **Examples:** Databricks SQL, Synapse Analytics, Snowflake, BigQuery, Redshift
- **Schema:** Denormalized (star/snowflake schema) — fewer joins, faster reads
- **Operations:** `SELECT` with aggregations, GROUP BY, window functions — scanning millions of rows
- **Users:** Analysts, BI tools (Power BI, Tableau), data scientists
- **Data volume:** Years of history — never deletes, always appends

```sql
-- OLAP query — complex, scans millions of rows, takes seconds
SELECT
    d.year,
    d.month,
    p.category,
    c.region,
    SUM(f.order_total) AS revenue,
    COUNT(DISTINCT f.customer_id) AS unique_customers
FROM fact_orders f
JOIN dim_date d ON f.date_id = d.date_id
JOIN dim_product p ON f.product_id = p.product_id
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE d.year = 2024
GROUP BY d.year, d.month, p.category, c.region
ORDER BY revenue DESC;
```

---

## Full Comparison

| Property | OLTP | OLAP |
|----------|------|------|
| **Purpose** | Run the business | Analyze the business |
| **Query type** | Simple, point lookups | Complex, aggregations |
| **Data scope** | Current state | Historical (years) |
| **Schema** | Normalized (3NF) | Denormalized (star schema) |
| **Optimization** | Write throughput | Read throughput |
| **Index strategy** | Many indexes on PKs/FKs | Columnar storage, partitioning |
| **Concurrency** | Thousands of small transactions | Few large scans |
| **Data freshness** | Real-time | Minutes to hours (after pipeline) |
| **Users** | Applications | Analysts, BI tools |
| **Azure example** | Azure SQL Database | Databricks SQL, Synapse Analytics |

---

## Why You Can't Run Analytics on OLTP

1. **Performance:** A query scanning 500M rows on an OLTP database blocks all application writes. SAP will grind to a halt.
2. **Schema mismatch:** Normalized schema = 15 JOIN operations for a simple revenue report.
3. **No history:** OLTP stores current state. You need the order as it was 2 years ago, not its current state.
4. **Conflict:** Analytics queries lock tables, causing write failures in the application.

---

## HTAP — Hybrid Transactional/Analytical Processing

Some modern databases serve both OLTP and OLAP workloads:

- **Azure Cosmos DB (analytical store)** — HTAP via Cosmos DB Synapse Link
- **SingleStore (MemSQL)** — row + column storage combined
- **TiDB** — HTAP open-source database

In practice, HTAP is useful for near-real-time dashboards on operational data (< 1 min latency) without a separate pipeline. For complex analytics on years of history, a proper lakehouse is still better.

---

## Real-World Pattern: OLTP → Pipeline → OLAP

```
SAP ERP (OLTP)
  ↓ ADF Copy Activity (nightly, incremental by modified_date)
ADLS Bronze (raw SAP export — CSV/Parquet, as-is)
  ↓ Databricks notebook (clean, type-cast, deduplicate)
ADLS Silver (Delta — clean SAP data, partitioned by date)
  ↓ Databricks notebook (star schema build, SCD2 processing)
ADLS Gold (Delta — fact_orders, dim_customer, dim_product)
  ↓ Databricks SQL / Synapse Link
Power BI (OLAP queries via DirectQuery or import mode)
```

The OLTP system (SAP) never gets touched by analytics queries. The pipeline extracts, transforms, and serves it from an analytical store.

---

## Azure-Specific Mapping

| System | Type | Notes |
|--------|------|-------|
| **Azure SQL Database** | OLTP | Row-oriented, transactional |
| **Azure Cosmos DB** | OLTP (NoSQL) | Document, key-value, graph |
| **Azure Synapse Analytics** | OLAP | Dedicated SQL pool = columnar warehouse |
| **Databricks SQL Warehouse** | OLAP | Delta Lake, photon engine |
| **Azure Analysis Services** | OLAP (semantic) | Tabular model, Power BI premium replacement |
