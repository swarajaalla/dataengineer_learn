---
sidebar_position: 3
---

# Window Functions

Window functions are the most important advanced SQL skill for data engineering. Used in transformations, deduplication, SCD2, running totals, and ranking.

---

## Syntax

```sql
function_name() OVER (
    PARTITION BY column1, column2   -- like GROUP BY but keeps all rows
    ORDER BY column3 DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- optional frame
)
```

---

## Ranking Functions

```sql
SELECT
    order_id,
    customer_id,
    amount,
    ROW_NUMBER()  OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn,
    RANK()        OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rnk,
    DENSE_RANK()  OVER (PARTITION BY customer_id ORDER BY amount DESC) AS dr
FROM orders;
```

| Function | Behavior | Example with ties (100,100,50) |
|----------|----------|-------------------------------|
| `ROW_NUMBER()` | Unique number per row | 1, 2, 3 |
| `RANK()` | Ties get same rank, next skipped | 1, 1, 3 |
| `DENSE_RANK()` | Ties get same rank, no skip | 1, 1, 2 |

---

## Deduplication (Most Common Use)

Keep only the latest row per entity. Essential for incremental pipelines.

```sql
WITH ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY order_id
               ORDER BY updated_at DESC
           ) AS rn
    FROM orders_raw
)
SELECT * EXCEPT(rn)
FROM ranked
WHERE rn = 1;
```

---

## LAG and LEAD

Access adjacent rows without a self-join.

```sql
SELECT
    order_date,
    revenue,
    LAG(revenue, 1)  OVER (ORDER BY order_date) AS prev_month_revenue,
    LEAD(revenue, 1) OVER (ORDER BY order_date) AS next_month_revenue,
    revenue - LAG(revenue, 1) OVER (ORDER BY order_date) AS mom_change
FROM monthly_revenue;
```

---

## Running Totals and Moving Averages

```sql
SELECT
    order_date,
    amount,
    SUM(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,

    AVG(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS rolling_7day_avg
FROM daily_orders;
```

---

## FIRST_VALUE and LAST_VALUE

```sql
SELECT
    customer_id,
    order_date,
    amount,
    FIRST_VALUE(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS first_order_amount,
    LAST_VALUE(amount)  OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS latest_order_amount
FROM orders;
```

`LAST_VALUE` needs the full frame (`UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`) or it returns the current row.

---

## NTILE — Percentile Buckets

```sql
SELECT
    customer_id,
    total_spend,
    NTILE(4) OVER (ORDER BY total_spend DESC) AS spend_quartile  -- 1=top 25%
FROM customer_summary;
```

---

## PERCENT_RANK and CUME_DIST

```sql
SELECT
    employee_id,
    salary,
    ROUND(PERCENT_RANK() OVER (ORDER BY salary), 2) AS percentile_rank,
    ROUND(CUME_DIST()    OVER (ORDER BY salary), 2) AS cumulative_dist
FROM employees;
```

---

## Real Pipeline Example: SCD2 with Window Functions

Identify changed records and assign validity dates:

```sql
WITH changes AS (
    SELECT *,
           LAG(customer_name) OVER (PARTITION BY customer_id ORDER BY valid_from) AS prev_name
    FROM customer_history
)
SELECT
    customer_id,
    customer_name,
    valid_from,
    COALESCE(
        LEAD(valid_from) OVER (PARTITION BY customer_id ORDER BY valid_from),
        DATE '9999-12-31'
    ) AS valid_to
FROM changes
WHERE customer_name != prev_name OR prev_name IS NULL;
```
