---
sidebar_position: 4
---

# CTEs and Subqueries

CTEs (Common Table Expressions) are how you write readable, maintainable SQL for complex transformations.

---

## CTE Syntax

```sql
WITH cte_name AS (
    SELECT ...
    FROM ...
),
another_cte AS (
    SELECT ...
    FROM cte_name   -- CTEs can reference each other
)
SELECT *
FROM another_cte;
```

---

## CTE vs Subquery

```sql
-- Subquery (hard to read, deeply nested)
SELECT customer_id, total_orders
FROM (
    SELECT customer_id, COUNT(*) AS total_orders
    FROM (
        SELECT customer_id, order_id
        FROM orders
        WHERE status = 'completed'
    ) active_orders
    GROUP BY customer_id
) agg
WHERE total_orders > 5;

-- CTE (same logic, readable)
WITH completed_orders AS (
    SELECT customer_id, order_id
    FROM orders
    WHERE status = 'completed'
),
order_counts AS (
    SELECT customer_id, COUNT(*) AS total_orders
    FROM completed_orders
    GROUP BY customer_id
)
SELECT customer_id, total_orders
FROM order_counts
WHERE total_orders > 5;
```

Prefer CTEs. They're easier to debug (run each step independently) and maintain.

---

## Multi-Step Transformation (Common Pattern)

```sql
WITH raw AS (
    -- Step 1: filter raw data
    SELECT *
    FROM orders
    WHERE order_date >= '2024-01-01'
      AND status != 'cancelled'
),
enriched AS (
    -- Step 2: join dimensions
    SELECT
        r.*,
        c.customer_name,
        c.region,
        p.product_category
    FROM raw r
    LEFT JOIN customers c ON r.customer_id = c.customer_id
    LEFT JOIN products p ON r.product_id = p.product_id
),
aggregated AS (
    -- Step 3: aggregate by region
    SELECT
        region,
        product_category,
        SUM(amount) AS revenue,
        COUNT(*) AS order_count
    FROM enriched
    GROUP BY region, product_category
)
-- Step 4: final output
SELECT
    region,
    product_category,
    revenue,
    order_count,
    ROUND(100.0 * revenue / SUM(revenue) OVER (), 2) AS revenue_pct
FROM aggregated
ORDER BY revenue DESC;
```

---

## Recursive CTE

Used for hierarchical data (org charts, bill of materials, network graphs).

```sql
WITH RECURSIVE org_hierarchy AS (
    -- Base: top-level managers
    SELECT employee_id, employee_name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: each employee's reports
    SELECT e.employee_id, e.employee_name, e.manager_id, h.level + 1
    FROM employees e
    JOIN org_hierarchy h ON e.manager_id = h.employee_id
)
SELECT * FROM org_hierarchy ORDER BY level, employee_name;
```

---

## Correlated Subquery

A subquery that references the outer query. Runs once per row — can be slow on large tables.

```sql
-- Find orders where amount > that customer's average
SELECT order_id, customer_id, amount
FROM orders o
WHERE amount > (
    SELECT AVG(amount)
    FROM orders
    WHERE customer_id = o.customer_id   -- references outer query
);
```

For large tables, prefer a JOIN to a precomputed CTE instead.

---

## EXISTS vs IN vs JOIN

```sql
-- EXISTS (fastest for large datasets — short-circuits)
SELECT order_id FROM orders o
WHERE EXISTS (SELECT 1 FROM customers c WHERE c.id = o.customer_id);

-- IN (good for small lists, breaks with NULLs)
SELECT order_id FROM orders
WHERE customer_id IN (SELECT id FROM customers WHERE region = 'EU');

-- JOIN (most flexible, use when you need columns from both)
SELECT o.order_id, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.id;
```
