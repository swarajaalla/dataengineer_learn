---
sidebar_position: 4
---

# Snowflake Schema

Snowflake schema extends the star schema by normalizing dimension tables — splitting them into sub-dimension tables to reduce redundancy.

---

## What It Is

In a snowflake schema, dimension tables are further normalized. Instead of storing `category, subcategory, brand` in `dim_product`, you split them out:

```
                  dim_date
                      |
dim_category ← dim_product ← fact_orders → dim_customer
                                   |
                              dim_store → dim_region → dim_country
```

Each arrow represents a join. Snowflake schema requires more joins than star schema to answer the same question.

---

## Star vs Snowflake: A Real Example

**Star schema (denormalized dim_product):**
```sql
CREATE TABLE gold.dim_product (
    product_id      INT,
    sku             VARCHAR(100),
    product_name    VARCHAR(300),
    brand           VARCHAR(100),     -- stored directly
    subcategory     VARCHAR(100),     -- stored directly
    category        VARCHAR(100)      -- stored directly (yes, some duplication)
);
-- 1M products × 3 category fields = some redundancy
-- But: only ONE table to join
```

**Snowflake schema (normalized dimensions):**
```sql
-- Now requires 3 tables and 2 extra joins to get the same category info
CREATE TABLE dim_product (product_id, sku, product_name, subcategory_id);
CREATE TABLE dim_subcategory (subcategory_id, subcategory_name, category_id);
CREATE TABLE dim_category (category_id, category_name);

-- Query: must join 3 tables to see product + category
SELECT p.product_name, sc.subcategory_name, c.category_name
FROM fact_orders f
JOIN dim_product p     ON f.product_id = p.product_id
JOIN dim_subcategory sc ON p.subcategory_id = sc.subcategory_id
JOIN dim_category c    ON sc.category_id = c.category_id;
```

---

## Star vs Snowflake Comparison

| Property | Star Schema | Snowflake Schema |
|----------|------------|-----------------|
| **Query complexity** | Low (fewer joins) | High (more joins) |
| **Query performance** | Better | Worse (join overhead) |
| **Storage redundancy** | Some duplication | Less duplication |
| **Storage saving** | Low (dimension tables are small) | Minor |
| **Maintenance** | Update one table | Update multiple tables |
| **Power BI performance** | Excellent | Worse (more relationships) |
| **Analyst usability** | Easier | Harder |

---

## When Snowflake Schema Is Justified

**Large dimension tables with high redundancy:**
If `dim_product` has 100M rows (unusual but possible) and 30% of rows share the same category, normalizing saves storage. For typical dimension tables with thousands to millions of rows, the storage saving is negligible.

**Category changes frequently:**
If product categories change and you want to update in one place, normalizing into `dim_category` means one UPDATE instead of updating all products.

**Data governance requirement:**
Some organizations require normalized designs for auditability.

---

## The Practical Reality

Most production data warehouses use star schema. Snowflake schema is taught in data modeling courses but rarely implemented in practice for new projects because:

1. Dimension tables are small — the storage saving is minimal
2. Join overhead impacts all queries, not just category-heavy ones
3. Power BI and Tableau work best with star schema relationships
4. Analysts constantly complain about join complexity

**If you're designing a new warehouse:** Start with star schema. Normalize only if you have a proven, specific reason.

---

## Partial Denormalization (The Pragmatic Middle)

Many real schemas are a mix:

```sql
CREATE TABLE dim_product (
    product_id      INT,
    sku             VARCHAR(100),
    product_name    VARCHAR(300),
    brand           VARCHAR(100),   -- denormalized (rarely changes)
    subcategory     VARCHAR(100),   -- denormalized (changes occasionally)
    category        VARCHAR(100),   -- denormalized (stable)
    supplier_id     INT             -- FK → dim_supplier (kept normalized, supplier has many attributes)
);

CREATE TABLE dim_supplier (
    supplier_id     INT,
    supplier_name   VARCHAR(200),
    country         VARCHAR(100),
    payment_terms   VARCHAR(50)
    -- 20+ more fields — worth keeping separate
);
```

Normalize when the related entity is large and meaningful. Denormalize when it's just a lookup value.
