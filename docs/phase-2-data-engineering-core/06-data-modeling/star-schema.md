---
sidebar_position: 3
---

# Star Schema

Star schema is the standard dimensional modeling pattern for data warehouses and lakehouse Gold layers. It's called "star" because the diagram looks like a star: fact table in the center, dimension tables radiating outward.

---

## What It Is

One central fact table joined to multiple denormalized dimension tables. Dimensions are not normalized — attributes like `category → subcategory → brand` all live in one `dim_product` table.

```
                 dim_date
                    |
dim_customer — fact_orders — dim_product
                    |
                dim_store
```

---

## Why Star Schema Performs Better

**Fewer joins:** Analytics queries touch 1 fact table + 2-3 dimension tables max. Normalized schemas require 6-10 joins for the same query.

**Optimizer-friendly:** Most query engines (Power BI, Tableau, Spark SQL) are optimized for star schema patterns.

**Predicate pushdown:** Filtering on `dim_product.category = 'Electronics'` pushes to the dimension table first, reducing the fact rows joined.

**Power BI:** When you import a star schema, Power BI's in-memory engine (VertiPaq) creates relationships between tables. Queries resolve in milliseconds.

---

## Designing a Star Schema: Step by Step

**Step 1: Identify the business process**
"We need to analyze sales performance."

**Step 2: Declare the grain**
"One row per order line item (one product in one order)."

**Step 3: Identify dimensions**
Who, what, where, when for each row:
- Who placed the order → `dim_customer`
- What was ordered → `dim_product`
- When → `dim_date`
- Where → `dim_store`

**Step 4: Identify facts (measures)**
- `quantity_ordered`
- `unit_price`
- `discount_amount`
- `revenue` (= qty × price - discount)
- `cost`
- `profit`

---

## Complete SQL DDL: Sales Star Schema

```sql
-- Dimension: Date (always build a date dimension — don't join on raw dates)
CREATE TABLE gold.dim_date (
    date_id         INT PRIMARY KEY,
    full_date       DATE,
    day_of_week     VARCHAR(10),    -- 'Monday', 'Tuesday'...
    day_num         INT,            -- 1-31
    week_num        INT,            -- ISO week number
    month_num       INT,            -- 1-12
    month_name      VARCHAR(20),
    quarter         INT,            -- 1-4
    year            INT,
    is_weekend      BOOLEAN,
    is_holiday      BOOLEAN,
    fiscal_year     INT,
    fiscal_quarter  INT
);

-- Dimension: Customer
CREATE TABLE gold.dim_customer (
    customer_id     INT PRIMARY KEY,  -- surrogate key
    customer_code   VARCHAR(50),      -- source system key
    customer_name   VARCHAR(200),
    email           VARCHAR(200),
    region          VARCHAR(100),
    country         VARCHAR(100),
    customer_tier   VARCHAR(50),
    sales_channel   VARCHAR(50)       -- 'online', 'direct', 'partner'
) USING DELTA;

-- Dimension: Product
CREATE TABLE gold.dim_product (
    product_id      INT PRIMARY KEY,
    sku             VARCHAR(100),
    product_name    VARCHAR(300),
    brand           VARCHAR(100),
    subcategory     VARCHAR(100),
    category        VARCHAR(100),     -- denormalized: category lives in dim_product
    unit_cost       DECIMAL(10,2),
    is_active       BOOLEAN
) USING DELTA;

-- Dimension: Store
CREATE TABLE gold.dim_store (
    store_id        INT PRIMARY KEY,
    store_code      VARCHAR(50),
    store_name      VARCHAR(200),
    city            VARCHAR(100),
    country         VARCHAR(100),
    region          VARCHAR(100),
    store_type      VARCHAR(50)       -- 'retail', 'online', 'partner'
) USING DELTA;

-- Fact: Orders (grain = one order line item)
CREATE TABLE gold.fact_orders (
    order_line_id   BIGINT,          -- surrogate PK
    order_id        VARCHAR(50),     -- degenerate dimension
    date_id         INT,             -- FK → dim_date
    customer_id     INT,             -- FK → dim_customer
    product_id      INT,             -- FK → dim_product
    store_id        INT,             -- FK → dim_store
    quantity        INT,
    unit_price      DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    revenue         DECIMAL(10,2),
    cost            DECIMAL(10,2),
    profit          DECIMAL(10,2)
) USING DELTA
PARTITIONED BY (date_id);
```

---

## Query Example

```sql
-- Monthly revenue by product category and customer region
SELECT
    d.year,
    d.month_name,
    p.category,
    c.region,
    SUM(f.revenue)                          AS total_revenue,
    SUM(f.profit)                           AS total_profit,
    ROUND(SUM(f.profit) / SUM(f.revenue), 3) AS profit_margin,
    COUNT(DISTINCT f.order_id)              AS order_count
FROM gold.fact_orders f
JOIN gold.dim_date d     ON f.date_id     = d.date_id
JOIN gold.dim_product p  ON f.product_id  = p.product_id
JOIN gold.dim_customer c ON f.customer_id = c.customer_id
WHERE d.year = 2024
GROUP BY d.year, d.month_name, p.category, c.region
ORDER BY total_revenue DESC;
```

---

## Building Star Schema in Databricks

```python
# Build fact_orders from Silver
fact_orders = spark.sql("""
    SELECT
        MONOTONICALLY_INCREASING_ID() AS order_line_id,
        o.order_id,
        d.date_id,
        c.customer_id,
        p.product_id,
        s.store_id,
        o.quantity,
        o.unit_price,
        o.discount_amount,
        (o.quantity * o.unit_price - o.discount_amount) AS revenue,
        (o.quantity * p.unit_cost) AS cost,
        (o.quantity * o.unit_price - o.discount_amount - o.quantity * p.unit_cost) AS profit
    FROM silver.orders o
    JOIN gold.dim_date d     ON o.order_date   = d.full_date
    JOIN gold.dim_customer c ON o.customer_code = c.customer_code
    JOIN gold.dim_product p  ON o.sku           = p.sku
    JOIN gold.dim_store s    ON o.store_code    = s.store_code
""")

fact_orders.write \
    .format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", "date_id >= 20240101") \
    .saveAsTable("gold.fact_orders")
```

---

## When NOT to Use Star Schema

- Very simple reporting (one or two tables) — star schema overhead not worth it
- Exploratory analysis where schema is unknown — use Silver tables
- Real-time operational queries — star schema is for analytical, not OLTP
- Team is dbt-only and building wide OBT tables — valid alternative at small scale
