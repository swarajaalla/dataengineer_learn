---
sidebar_position: 5
---

# SQL Optimization

Slow queries in production delay reports and waste compute. Understanding why queries are slow is a core data engineering skill.

---

## How to Diagnose a Slow Query

1. Run `EXPLAIN` (or `EXPLAIN ANALYZE`) to see the execution plan
2. Look for full table scans, large shuffles, or cartesian joins
3. Check row counts at each step — unexpected growth = fanout or bad join

```sql
EXPLAIN SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.amount > 1000;
```

---

## Rule 1: Filter Early

Apply WHERE conditions before joins and aggregations. Smaller tables = faster operations.

```sql
-- Slow: joins first, then filters
SELECT o.*, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.amount > 1000 AND o.region = 'EU';

-- Better: filter before join (optimizer usually does this, but be explicit in Spark/dbt)
WITH filtered_orders AS (
    SELECT * FROM orders WHERE amount > 1000 AND region = 'EU'
)
SELECT o.*, c.name
FROM filtered_orders o
JOIN customers c ON o.customer_id = c.id;
```

---

## Rule 2: Select Only Needed Columns

`SELECT *` reads all columns from disk (in columnar formats like Parquet, this is expensive).

```sql
-- Bad
SELECT * FROM orders;

-- Good
SELECT order_id, customer_id, amount, order_date FROM orders;
```

In Spark/Delta: selecting fewer columns can cut read time by 80%+ on wide tables.

---

## Rule 3: Use Partition Pruning

Always filter on the partition column — lets the engine skip irrelevant files entirely.

```sql
-- orders is partitioned by order_year, order_month

-- Fast: partition filter applied
SELECT * FROM orders WHERE order_year = 2024 AND order_month = 1;

-- Slow: no partition filter — reads entire table
SELECT * FROM orders WHERE YEAR(order_date) = 2024;
-- The function call prevents partition pruning!
```

**In Delta/Parquet:** Use the partition column as-is, not wrapped in a function.

---

## Rule 4: Avoid Functions on Indexed/Partition Columns

Functions on partition or join columns prevent the optimizer from using metadata skipping.

```sql
-- Bad: function prevents predicate pushdown
WHERE UPPER(status) = 'ACTIVE'
WHERE YEAR(order_date) = 2024
WHERE CAST(id AS STRING) = '123'

-- Good
WHERE status = 'active'                 -- store data consistently cased
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31'
WHERE id = 123
```

---

## Rule 5: Avoid Cartesian Joins

A join without a condition (or with a always-true condition) creates a cartesian product.

```sql
-- Cartesian: 1000 rows × 500 rows = 500,000 rows
SELECT * FROM orders, customers;

-- Correct: always specify the join condition
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;
```

---

## Rule 6: Prefer EXISTS over COUNT for Existence Checks

```sql
-- Slow: counts all matching rows
SELECT order_id FROM orders
WHERE (SELECT COUNT(*) FROM customers WHERE id = orders.customer_id) > 0;

-- Fast: stops at first match
SELECT order_id FROM orders
WHERE EXISTS (SELECT 1 FROM customers WHERE id = orders.customer_id);
```

---

## Z-ORDER in Delta Lake (Advanced)

Z-ORDER clusters data in files by specific column values — dramatically improves skipping for non-partition filter columns.

```sql
-- After partitioning by order_year, Z-ORDER within partitions by customer_id
OPTIMIZE silver.orders ZORDER BY (customer_id, product_id);

-- Now queries like this are fast:
SELECT * FROM silver.orders
WHERE order_year = 2024 AND customer_id = 'C001';
```

Run OPTIMIZE+ZORDER weekly for high-query tables in Databricks.

---

## Common Patterns to Avoid

| Pattern | Problem | Better Approach |
|---------|---------|----------------|
| `SELECT *` | Reads all columns | Select only needed |
| `COUNT(*)` on huge tables | Full scan | Approximate count or use metadata |
| Subquery in `WHERE` per row | N+1 scans | Rewrite as JOIN or CTE |
| `DISTINCT` everywhere | Hides join issues | Fix the fanout root cause |
| No partition filter | Full table scan | Always filter on partition column |
