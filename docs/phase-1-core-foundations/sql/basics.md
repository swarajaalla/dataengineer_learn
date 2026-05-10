---
sidebar_position: 1
---

# SQL Basics

SQL is the most-used language in data engineering. You use it in Databricks, Snowflake, dbt, and every analytical query.

---

## Data Types

```sql
-- Common types you'll use daily
INT, BIGINT          -- IDs, counts
DECIMAL(18,2)        -- Money — never use FLOAT for currency
VARCHAR(255)         -- Text
DATE                 -- 2024-01-15
TIMESTAMP            -- 2024-01-15 08:30:00
BOOLEAN              -- true/false
ARRAY<STRING>        -- Spark/BigQuery nested data
STRUCT<name:STRING>  -- Spark nested structs
```

---

## SELECT Fundamentals

```sql
SELECT
    order_id,
    customer_id,
    amount,
    order_date,
    UPPER(status) AS status_upper,
    amount * 1.2 AS amount_with_tax
FROM orders
WHERE status = 'active'
  AND amount > 100
  AND order_date >= '2024-01-01'
ORDER BY order_date DESC
LIMIT 100;
```

---

## Filtering — Important Operators

```sql
-- NULL handling — always use IS NULL, not = NULL
WHERE column IS NULL
WHERE column IS NOT NULL

-- String matching
WHERE name LIKE 'Acme%'       -- starts with
WHERE name LIKE '%Corp'       -- ends with
WHERE name ILIKE '%corp%'     -- case-insensitive (PostgreSQL/Databricks)

-- List
WHERE status IN ('active', 'pending')
WHERE status NOT IN ('deleted', 'archived')

-- Range
WHERE amount BETWEEN 100 AND 500

-- Date range
WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'
```

---

## Aggregations

```sql
SELECT
    region,
    status,
    COUNT(*)                      AS total_orders,
    COUNT(DISTINCT customer_id)   AS unique_customers,
    SUM(amount)                   AS total_revenue,
    AVG(amount)                   AS avg_order_value,
    MIN(amount)                   AS min_order,
    MAX(amount)                   AS max_order,
    ROUND(AVG(amount), 2)         AS avg_rounded
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY region, status
HAVING COUNT(*) > 10              -- filter on aggregated result
ORDER BY total_revenue DESC;
```

---

## String Functions

```sql
UPPER(name)              -- 'ACME CORP'
LOWER(name)              -- 'acme corp'
TRIM(name)               -- removes leading/trailing spaces
LTRIM(name)              -- left trim
RTRIM(name)              -- right trim
LENGTH(name)             -- character count
SUBSTRING(name, 1, 3)   -- 'Acm' (start pos, length)
CONCAT(first, ' ', last) -- 'John Doe'
REPLACE(name, 'Ltd', 'Limited')
SPLIT(email, '@')[0]     -- everything before @ (Spark syntax)
```

---

## Date Functions

```sql
CURRENT_DATE             -- today
CURRENT_TIMESTAMP        -- now

DATE_TRUNC('month', order_date)    -- first day of month
DATE_TRUNC('year', order_date)     -- Jan 1 of year

DATEADD(day, 7, order_date)        -- add 7 days
DATEDIFF(day, start_date, end_date) -- days between

YEAR(order_date)         -- 2024
MONTH(order_date)        -- 1-12
DAY(order_date)          -- 1-31
DAYOFWEEK(order_date)    -- 1=Sunday
```

---

## CASE Expressions

```sql
SELECT
    order_id,
    amount,
    CASE
        WHEN amount >= 1000 THEN 'premium'
        WHEN amount >= 500  THEN 'standard'
        ELSE 'basic'
    END AS tier,
    CASE status
        WHEN 'active'    THEN 1
        WHEN 'completed' THEN 2
        ELSE 0
    END AS status_code
FROM orders;
```

---

## NULL Handling

```sql
-- COALESCE: return first non-null
COALESCE(phone, mobile, 'N/A')

-- NULLIF: return null if value equals something
NULLIF(division_by, 0)   -- prevents divide by zero

-- Safe division
amount / NULLIF(quantity, 0)

-- IFNULL / NVL (some dialects)
IFNULL(discount, 0)
```
