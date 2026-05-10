---
sidebar_position: 3
---

# Transformations

Transformations are the operations that convert raw data into clean, usable data. Every Silver notebook is a collection of transformations.

---

## 1. Cleaning Transformations

The most common category. Fix what's broken in the raw data.

**Null handling:**
```python
from pyspark.sql.functions import col, coalesce, lit, when

# Fill nulls with a default
df = df.fillna({
    "country": "UNKNOWN",
    "discount": 0.0,
    "cancelled_at": None
})

# Business rule: if total is null but qty and price exist, calculate it
df = df.withColumn(
    "order_total",
    coalesce(col("order_total"), col("qty") * col("price"))
)

# Flag records with critical nulls (don't drop — quarantine)
df = df.withColumn(
    "has_data_issue",
    when(col("customer_id").isNull() | col("order_date").isNull(), True).otherwise(False)
)
```

**Type casting:**
```python
from pyspark.sql.functions import to_date, to_timestamp, regexp_replace

df = df \
    .withColumn("order_date", to_date(col("order_date_str"), "yyyy-MM-dd")) \
    .withColumn("order_total", col("order_total_str").cast("double")) \
    .withColumn("customer_id", col("customer_id_str").cast("long")) \
    .withColumn("order_total_clean",
                regexp_replace(col("order_total_str"), "[^0-9.]", "").cast("double"))
```

**Deduplication:**
```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, desc

# Keep latest version of each order (by updated_at timestamp)
window = Window.partitionBy("order_id").orderBy(desc("updated_at"))

df_deduped = df \
    .withColumn("rn", row_number().over(window)) \
    .filter(col("rn") == 1) \
    .drop("rn")
```

**String cleaning:**
```python
from pyspark.sql.functions import trim, upper, lower, regexp_replace

df = df \
    .withColumn("customer_name", trim(upper(col("customer_name")))) \
    .withColumn("email", lower(trim(col("email")))) \
    .withColumn("phone", regexp_replace(col("phone"), "[^0-9+]", ""))
```

---

## 2. Structural Transformations

Change the shape of the data.

**Flattening nested JSON (struct):**
```python
# Input: customer is a struct with nested fields
df.select(
    col("order_id"),
    col("customer.id").alias("customer_id"),
    col("customer.name").alias("customer_name"),
    col("customer.address.city").alias("city"),
    col("customer.address.country").alias("country")
)
```

**Exploding arrays:**
```python
from pyspark.sql.functions import explode

# One order → multiple line items
df_items = df.withColumn("item", explode(col("line_items"))) \
    .select(
        col("order_id"),
        col("item.sku").alias("sku"),
        col("item.qty").alias("qty"),
        col("item.price").alias("unit_price")
    )
```

**Pivot:**
```python
# Monthly revenue per region as columns
df.groupBy("year") \
  .pivot("region", ["DE", "UK", "US", "FR"]) \
  .agg({"revenue": "sum"})
# Result: year | DE | UK | US | FR
```

---

## 3. Enrichment Transformations

Join reference data or compute derived values.

**Joining dimension tables:**
```python
# Enrich orders with customer region from dim_customer
orders = spark.table("silver.orders")
customers = spark.table("silver.dim_customer")

enriched = orders.join(
    customers.select("customer_id", "region", "customer_tier"),
    on="customer_id",
    how="left"  # left join — keep all orders even if customer missing
)
```

**Adding calculated columns:**
```python
from pyspark.sql.functions import months_between, current_date, datediff

df = df \
    .withColumn("days_since_order", datediff(current_date(), col("order_date"))) \
    .withColumn("order_month", col("order_date").substr(1, 7)) \
    .withColumn("revenue_tier",
                when(col("order_total") >= 10000, "Enterprise")
                .when(col("order_total") >= 1000, "Mid-Market")
                .otherwise("SMB"))
```

---

## 4. Aggregation Transformations

Summarize data for reporting.

```python
from pyspark.sql.functions import sum, count, avg, countDistinct, min, max

# Daily revenue by product category and region
df_agg = df.groupBy("order_date", "product_category", "region") \
    .agg(
        sum("order_total").alias("daily_revenue"),
        count("order_id").alias("order_count"),
        countDistinct("customer_id").alias("unique_customers"),
        avg("order_total").alias("avg_order_value"),
        min("order_total").alias("min_order"),
        max("order_total").alias("max_order")
    )
```

**Window functions (running totals, rankings):**
```python
from pyspark.sql.window import Window
from pyspark.sql.functions import sum, rank

# Running total per customer, ordered by date
window = Window.partitionBy("customer_id").orderBy("order_date") \
               .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df = df.withColumn("cumulative_revenue", sum("order_total").over(window))

# Rank customers by total spend
rank_window = Window.orderBy(desc("total_spend"))
df_customers = df_customers.withColumn("spend_rank", rank().over(rank_window))
```

---

## 5. Validation Transformations

Separate bad records from good ones instead of silently corrupting Silver.

```python
# Define quality rules
df = df \
    .withColumn("is_valid_order_id", col("order_id").rlike("^ORD-[0-9]+$")) \
    .withColumn("is_valid_total", (col("order_total") >= 0) & col("order_total").isNotNull()) \
    .withColumn("is_valid_date", col("order_date").isNotNull() & 
                                 (col("order_date") >= "2020-01-01"))

# Route valid records to Silver
df_valid = df.filter(
    col("is_valid_order_id") & col("is_valid_total") & col("is_valid_date")
)

# Route invalid records to quarantine table
df_invalid = df.filter(
    ~col("is_valid_order_id") | ~col("is_valid_total") | ~col("is_valid_date")
)

df_valid.write.format("delta").mode("append").save("/silver/orders/")
df_invalid.write.format("delta").mode("append").save("/quarantine/orders/")
```

---

## Common Antipatterns

**Using pandas on large data:**
```python
# BAD — pandas loads all data into driver memory
pandas_df = spark_df.toPandas()  # crashes on 100M rows

# GOOD — stay in Spark
spark_df.groupBy(...).agg(...)
```

**Python UDFs on every row:**
```python
# BAD — UDF runs in Python, breaks JVM optimization
@udf("string")
def clean_phone(phone):
    return re.sub(r"[^0-9+]", "", phone or "")

df.withColumn("phone", clean_phone(col("phone")))  # 10x slower than Spark SQL

# GOOD — use built-in Spark functions
from pyspark.sql.functions import regexp_replace
df.withColumn("phone", regexp_replace(col("phone"), "[^0-9+]", ""))
```
