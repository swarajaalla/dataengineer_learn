---
sidebar_position: 2
---

# SQL Joins

Joins are used constantly in data pipelines. You must understand all types and be able to debug wrong results.

---

## Join Types

```sql
-- INNER JOIN: only matching rows in both tables
SELECT o.order_id, c.customer_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;

-- LEFT JOIN: all rows from left, nulls where no match on right
SELECT o.order_id, c.customer_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;

-- RIGHT JOIN: all rows from right (rarely used — swap tables and use LEFT)
-- FULL OUTER JOIN: all rows from both, nulls where no match
```

---

## Anti-Join (Critical for Pipelines)

Find rows in table A that have NO match in table B.

```sql
-- Method 1: LEFT JOIN + IS NULL
SELECT o.order_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL;   -- orders with no matching customer

-- Method 2: NOT EXISTS (often faster)
SELECT order_id
FROM orders o
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id
);

-- Method 3: NOT IN (avoid on large datasets — slow, breaks with NULLs)
SELECT order_id
FROM orders
WHERE customer_id NOT IN (SELECT customer_id FROM customers);
```

**Use case in pipelines:** Find records in staging that are NOT yet in target → insert only those.

---

## Semi-Join

Find rows in A where a match EXISTS in B — but don't return B's columns.

```sql
SELECT order_id, amount
FROM orders
WHERE EXISTS (
    SELECT 1 FROM customers WHERE customer_id = orders.customer_id
);
```

---

## Self-Join

Join a table to itself. Used for hierarchies (manager-employee) or comparing rows.

```sql
-- Find employees and their manager names
SELECT
    e.employee_name,
    m.employee_name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

---

## Multiple Join Conditions

```sql
-- Join on multiple columns
SELECT *
FROM orders o
JOIN order_details d
    ON o.order_id = d.order_id
    AND o.region = d.region;    -- ensures correct partitioned join
```

---

## Join Performance Rules

1. **Join on indexed/partitioned columns** — avoids full scans
2. **Filter before joining** — reduce table size first with WHERE
3. **Avoid `SELECT *` in joins** — select only needed columns
4. **Watch for fanout** — joining on a non-unique key multiplies rows

```sql
-- Fanout example — if customers has multiple rows per customer_id:
-- orders (1M rows) JOIN customers (3M rows with duplicates)
-- Result could be 5M+ rows (wrong!)

-- Always verify uniqueness of join key:
SELECT customer_id, COUNT(*) FROM customers GROUP BY customer_id HAVING COUNT(*) > 1;
```

---

## Debugging Wrong Join Results

| Symptom | Likely Cause |
|---------|-------------|
| More rows than expected | Duplicate keys in one of the tables (fanout) |
| Fewer rows than expected | INNER JOIN losing non-matching rows — use LEFT JOIN |
| NULL values everywhere | Key columns have different data types or casing |
| Correct count, wrong values | Wrong join condition — joined on wrong columns |
