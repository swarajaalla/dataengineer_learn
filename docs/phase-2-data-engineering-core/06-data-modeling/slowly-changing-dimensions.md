---
sidebar_position: 5
---

# Slowly Changing Dimensions (SCDs)

SCDs handle dimension attributes that change over time. The question is: do you preserve history or just update the current value?

---

## Why SCDs Matter

A customer moves from Berlin to Munich. Their `region` in `dim_customer` should change. But:

- Orders placed when they were in Berlin should still show `region = Berlin`
- Orders placed after the move should show `region = Munich`

Without SCD handling, changing the region in `dim_customer` retroactively changes the region on historical orders — breaking analytics.

---

## SCD Type 0: Fixed / No Change

Some attributes should never change. Lock them in.

```sql
-- customer_acquisition_date never changes after creation
-- birth_date doesn't change
-- original_customer_code from source system stays fixed
```

No special handling needed — just don't update these columns.

---

## SCD Type 1: Overwrite (No History)

Update the value, lose the history. Use this when history doesn't matter.

```sql
-- Customer's email changed
UPDATE dim_customer
SET email = 'new@acme.com', updated_at = CURRENT_TIMESTAMP
WHERE customer_code = 'C-1001';
```

**When to use:** Contact info, preferences, non-analytical attributes.
**When NOT to use:** Anything you'll use to slice historical facts (region, customer tier, product category).

```python
# PySpark SCD Type 1 using Delta MERGE
silver = DeltaTable.forPath(spark, "/gold/dim_customer/")
silver.alias("tgt").merge(
    source_df.alias("src"),
    "tgt.customer_code = src.customer_code"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()
```

---

## SCD Type 2: Add New Row (Full History)

The most important SCD type. Add a new row for each change, preserving the old row as history.

Each row gets:
- `valid_from` — when this version became active
- `valid_to` — when it was superseded (NULL = currently active)
- `is_current` — flag for easy filtering to current version

```
customer_id | customer_code | region | tier       | valid_from | valid_to   | is_current
1           | C-1001        | DE     | MID-MARKET | 2022-01-01 | 2024-03-14 | false
2           | C-1001        | UK     | MID-MARKET | 2024-03-15 | 2024-09-30 | false
3           | C-1001        | UK     | ENTERPRISE | 2024-10-01 | NULL       | true
```

Historical orders joining on `customer_id` will get the region that was active when the order was placed — **if you join on surrogate key stored at order time**.

---

## SCD Type 2 Implementation in Databricks

```python
from delta.tables import DeltaTable
from pyspark.sql.functions import col, lit, current_date, expr

# Source: new/updated customer records from Silver
source_df = spark.table("silver.customers") \
    .filter(col("extraction_date") == current_date_str)

# Target: current state of dim_customer (SCD Type 2)
dim_customer = DeltaTable.forPath(spark, "/gold/dim_customer/")

# Step 1: Find changed records
# Join source to current dim records, detect changes
changed = source_df.alias("src").join(
    dim_customer.toDF().filter(col("is_current") == True).alias("tgt"),
    on="customer_code",
    how="left"
).filter(
    col("tgt.customer_code").isNull() |  # new customers
    (col("src.region") != col("tgt.region")) |
    (col("src.customer_tier") != col("tgt.customer_tier"))
)

# Step 2: Expire old rows for changed records
# Set valid_to = today - 1, is_current = false
dim_customer.alias("tgt").merge(
    changed.select("customer_code").alias("src"),
    "tgt.customer_code = src.customer_code AND tgt.is_current = true"
).whenMatchedUpdate(set={
    "valid_to": "date_sub(current_date(), 1)",
    "is_current": "false"
}).execute()

# Step 3: Insert new current rows
new_rows = changed.select(
    expr("MONOTONICALLY_INCREASING_ID()").alias("customer_id"),  # new surrogate key
    col("src.customer_code"),
    col("src.customer_name"),
    col("src.region"),
    col("src.customer_tier"),
    col("src.email"),
    current_date().alias("valid_from"),
    lit(None).cast("date").alias("valid_to"),
    lit(True).alias("is_current")
)

new_rows.write.format("delta") \
    .mode("append") \
    .save("/gold/dim_customer/")
```

---

## SCD Type 3: Add a Previous-Value Column

Keep only the previous value (one level of history).

```sql
ALTER TABLE dim_customer ADD COLUMN previous_region VARCHAR(100);

-- When region changes:
UPDATE dim_customer
SET previous_region = region,
    region = 'UK',
    region_changed_date = '2024-03-15'
WHERE customer_code = 'C-1001';
```

**When to use:** Only when you need "current vs previous" (e.g., was this customer's tier upgraded or downgraded?) and full history is overkill.

**Limitation:** Only one previous value. Three changes = only last change visible.

---

## SCD Type 6: Mini/Maxi (1+2+3 Combined)

Adds current attribute columns to the SCD2 row, so every historical row shows both the historical value AND the current value.

```
customer_id | region | current_region | valid_from | valid_to   | is_current
1           | DE     | UK             | 2022-01-01 | 2024-03-14 | false
2           | UK     | UK             | 2024-03-15 | NULL       | true
```

Useful when you need "what was it then?" and "what is it now?" in the same query without a second join.

---

## Which SCD Type to Choose

| Situation | SCD Type |
|-----------|---------|
| History never needed for this attribute | Type 0 or 1 |
| Simple overwrite, no audit needed | Type 1 |
| Full history needed for accurate historical reporting | Type 2 |
| Need current vs previous comparison | Type 3 |
| Need both historical and current in same row | Type 6 |
| Default for most dimension attributes that analysts use to slice facts | **Type 2** |
