---
sidebar_position: 1
---

# Data Modeling Overview

Data modeling is the process of designing how data is structured, organized, and related so that it serves its intended purpose efficiently. The wrong model makes queries slow, confuses analysts, and creates broken reports.

---

## Two Fundamentally Different Modeling Approaches

**OLTP Modeling (normalized):**
- Designed to minimize data duplication
- Many tables, many joins
- Optimized for writes (INSERT, UPDATE, DELETE)
- 3rd Normal Form (3NF): every attribute depends only on the key

**OLAP Modeling (denormalized):**
- Designed to minimize query complexity and maximize read performance
- Fewer tables, fewer joins, some intentional duplication
- Optimized for reads (GROUP BY, aggregations, wide table scans)
- Star schema: one central fact table surrounded by dimension tables

Data engineers mostly work with OLAP modeling for analytical layers (Gold).

---

## Why Normalized OLTP Schema Fails for Analytics

```sql
-- Normalized schema: 6 joins to get a simple revenue report
SELECT p.category, r.name AS region, SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN customers c ON o.customer_id = c.id
JOIN addresses a ON c.address_id = a.id
JOIN regions r ON a.region_id = r.id
JOIN products p ON oi.product_id = p.id
WHERE o.order_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY p.category, r.name;

-- In a star schema: 3 joins, 10x faster
SELECT p.category, c.region, SUM(f.revenue)
FROM fact_orders f
JOIN dim_product p ON f.product_id = p.product_id
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.order_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY p.category, c.region;
```

---

## The 3 Normal Forms (Brief)

**1NF:** No repeating groups. Each column holds one atomic value.

**2NF:** No partial dependencies. Every non-key attribute depends on the whole primary key.

**3NF:** No transitive dependencies. Every non-key attribute depends only on the primary key, not on other non-key attributes.

Warehouses intentionally violate 3NF (by duplicating attributes into dimension tables) to eliminate joins at query time.

---

## Introduction to Key Modeling Patterns

| Pattern | Use case | Complexity |
|---------|---------|-----------|
| **Star Schema** | Standard BI reporting | Low |
| **Snowflake Schema** | Normalized dimensions for large tables | Medium |
| **Slowly Changing Dimensions** | Track historical attribute changes | Medium–High |
| **Medallion Architecture** | Organize data lake layers | Low |
| **One Big Table (OBT)** | Pre-joined wide table for simple querying | Low (but denormalized) |

---

## Modeling Tools

- **ERD tools:** dbdiagram.io, Lucidchart (design phase)
- **dbt:** SQL-based transformation with built-in documentation and lineage
- **Delta DDL:** `CREATE TABLE ... USING DELTA` in Databricks SQL
- **Unity Catalog:** Stores metadata (descriptions, owners, tags) on tables and columns
