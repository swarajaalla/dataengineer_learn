# SQL for Data Engineering (Azure + Databricks)

Most people underestimate SQL. In reality, it’s the most used skill in data engineering.

## What companies actually expect

You should be able to:
- Write complex joins across multiple tables
- Debug data issues using SQL
- Optimize queries for large datasets
- Build transformations for pipelines

---

## Core Concepts (Non-negotiable)

### 1. Joins (Deep understanding)

- INNER JOIN
- LEFT JOIN
- Anti Join (very important in pipelines)

Example:
```sql
SELECT a.*
FROM orders a
LEFT JOIN customers b
  ON a.customer_id = b.id
WHERE b.id IS NULL;