---
sidebar_position: 1
---

# SQL Interview Questions

The most common SQL questions in data engineering interviews. Short, direct answers with working code.

---

## Q1: Find the nth highest salary

```sql
-- Using DENSE_RANK (handles ties)
SELECT salary
FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk = 2;  -- change 2 to n

-- Using OFFSET (simple, PostgreSQL/ANSI)
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
OFFSET 1 LIMIT 1;  -- OFFSET 0 = max, OFFSET 1 = 2nd highest
```

---

## Q2: Find duplicate records

```sql
-- Show which values are duplicated and how many times
SELECT order_id, COUNT(*) AS occurrences
FROM orders
GROUP BY order_id
HAVING COUNT(*) > 1;

-- Show all duplicate rows with their details
SELECT *
FROM orders
WHERE order_id IN (
    SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1
)
ORDER BY order_id;
```

---

## Q3: Delete duplicates, keep latest

```sql
-- Keep only the row with the latest updated_at per order_id
DELETE FROM orders
WHERE id NOT IN (
    SELECT MAX(id)
    FROM orders
    GROUP BY order_id
);

-- Using CTE (more readable)
WITH to_keep AS (
    SELECT MAX(id) AS keep_id
    FROM orders
    GROUP BY order_id
)
DELETE FROM orders WHERE id NOT IN (SELECT keep_id FROM to_keep);
```

---

## Q4: Running total

```sql
SELECT
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING) AS running_total
FROM orders
ORDER BY order_date;
```

---

## Q5: Month-over-month growth

```sql
WITH monthly AS (
    SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue
    FROM orders
    GROUP BY 1
)
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
    ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
          / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2) AS growth_pct
FROM monthly;
```

---

## Q6: Customers who bought in January but not February

```sql
-- Anti-join approach
SELECT DISTINCT customer_id
FROM orders
WHERE MONTH(order_date) = 1 AND YEAR(order_date) = 2024
  AND customer_id NOT IN (
      SELECT customer_id FROM orders
      WHERE MONTH(order_date) = 2 AND YEAR(order_date) = 2024
  );

-- LEFT JOIN approach (more efficient)
SELECT DISTINCT jan.customer_id
FROM (SELECT DISTINCT customer_id FROM orders WHERE MONTH(order_date) = 1) jan
LEFT JOIN (SELECT DISTINCT customer_id FROM orders WHERE MONTH(order_date) = 2) feb
    ON jan.customer_id = feb.customer_id
WHERE feb.customer_id IS NULL;
```

---

## Q7: Top N per group

```sql
-- Top 3 orders per customer by amount
SELECT customer_id, order_id, amount
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn
    FROM orders
) ranked
WHERE rn <= 3;
```

---

## Q8: Pivot rows to columns

```sql
-- Convert status counts to columns
SELECT
    order_date,
    COUNT(CASE WHEN status = 'pending'   THEN 1 END) AS pending,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled
FROM orders
GROUP BY order_date;
```

---

## Q9: Self-join for hierarchy

```sql
-- Employee and their manager name
SELECT
    e.employee_name AS employee,
    m.employee_name AS manager,
    e.department
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

---

## Q10: Difference between two date columns

```sql
-- Days since last order per customer
SELECT
    customer_id,
    MAX(order_date) AS last_order,
    CURRENT_DATE - MAX(order_date) AS days_since_last_order
FROM orders
GROUP BY customer_id
ORDER BY days_since_last_order DESC;
```
