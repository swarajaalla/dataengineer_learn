---
sidebar_position: 2
---

# Fact and Dimension Tables

The foundation of dimensional modeling. Every star schema is built from facts (what happened) and dimensions (context about what happened).

---

## Fact Tables

A fact table stores **measurements and events** — quantitative data about business processes.

- One row = one business event (one order, one shipment, one payment)
- Contains foreign keys to dimension tables + numeric measures
- Typically the largest table in the model (millions to billions of rows)
- Append-heavy — historical events don't change

**Example:** `fact_orders`
```sql
CREATE TABLE gold.fact_orders (
    order_id        BIGINT,         -- degenerate dimension (no dim table)
    customer_id     INT,            -- FK to dim_customer
    product_id      INT,            -- FK to dim_product
    date_id         INT,            -- FK to dim_date
    store_id        INT,            -- FK to dim_store
    -- Measures
    quantity        INT,
    unit_price      DECIMAL(10,2),
    discount_pct    DECIMAL(5,2),
    revenue         DECIMAL(10,2),  -- pre-calculated: qty * unit_price * (1-discount)
    cost            DECIMAL(10,2),
    profit          DECIMAL(10,2)   -- pre-calculated: revenue - cost
);
```

---

## Grain: The Most Important Decision

**Grain = what does one row represent?**

Get this wrong and the entire model is broken.

| Grain | Meaning | Correct? |
|-------|---------|---------|
| One order | One row per order (total) | Only if you never need line-item detail |
| One line item | One row per product in the order | If analysts ask "units sold per product" |
| One daily summary | One row per customer per day | If you only need daily aggregates |

**Declare the grain explicitly and document it.** "fact_orders: one row per order line item."

---

## Types of Facts

| Type | Definition | Example | Can you SUM it? |
|------|-----------|---------|----------------|
| **Additive** | Can be summed across all dimensions | Revenue, quantity, cost | Yes |
| **Semi-additive** | Can be summed across some dimensions, not all | Account balance (can sum across accounts but not across dates) | Partial |
| **Non-additive** | Cannot be summed meaningfully | Ratios, percentages, unit prices | No |

**Implication:** A "profit margin %" stored as a fact is non-additive. To calculate aggregate margin, you need `SUM(profit) / SUM(revenue)` — not `SUM(profit_margin_pct)`.

---

## Dimension Tables

Dimension tables provide **descriptive context** for facts. They answer: who, what, where, when, how.

```sql
CREATE TABLE gold.dim_customer (
    customer_id     INT PRIMARY KEY,    -- surrogate key
    customer_code   VARCHAR(50),        -- natural/business key from source
    customer_name   VARCHAR(200),
    email           VARCHAR(200),
    region          VARCHAR(100),
    country         VARCHAR(100),
    customer_tier   VARCHAR(50),        -- ENTERPRISE, MID, SMB
    acquired_date   DATE,
    -- SCD Type 2 fields
    valid_from      DATE,
    valid_to        DATE,
    is_current      BOOLEAN
);
```

Dimensions are narrow (few rows relative to facts) but wide (many descriptive columns).

---

## Surrogate Keys vs Natural Keys

**Natural key:** The ID from the source system (`customer_code = 'CUST-001'`)

**Surrogate key:** A system-generated integer PK (`customer_id = 12345`)

Use surrogate keys in the warehouse because:
1. Natural keys from different sources may conflict
2. SCD Type 2 needs multiple rows per business entity — surrogate key differentiates them
3. Integer joins are faster than string joins
4. Source system keys can change or be reused

---

## Degenerate Dimensions

A dimension attribute stored directly in the fact table — no dimension table needed.

Common examples: `order_id`, `invoice_number`, `transaction_id`

These are identifiers with no descriptive attributes beyond the ID itself. No need to create `dim_order` with just an ID column.

---

## Conformed Dimensions

A dimension table shared across multiple fact tables.

```sql
-- dim_customer is used in:
-- fact_orders (who placed the order?)
-- fact_support_tickets (who raised the ticket?)
-- fact_returns (who returned the item?)

-- All three fact tables join to the SAME dim_customer
-- So a report combining orders + returns makes sense
```

Conformed dimensions ensure consistency: the customer in the orders fact is the same entity as the customer in the returns fact.

**When dimensions are NOT conformed:** Two fact tables join to two different customer tables with different definitions — counts won't reconcile. This is the root cause of most "the numbers don't match" complaints.

---

## Real Example: Sales Star Schema

```
                    dim_date
                       |
dim_store -- fact_orders -- dim_product
                       |
                  dim_customer

fact_orders has:
  date_id → dim_date (date, month, quarter, year, is_holiday, day_of_week)
  customer_id → dim_customer (name, region, tier, acquisition_channel)
  product_id → dim_product (name, category, subcategory, brand, unit_cost)
  store_id → dim_store (name, city, country, manager, store_type)
  
  Measures: quantity, unit_price, discount, revenue, cost, profit
```

A single query can now aggregate revenue by product category AND customer region AND quarter AND store type — with only 4 joins.
