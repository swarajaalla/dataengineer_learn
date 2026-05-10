---
sidebar_position: 2
---

# Fabric Lakehouse

The Lakehouse is the primary data engineering workspace in Microsoft Fabric. It combines Delta Lake storage with an automatic SQL analytics endpoint — no setup required.

---

## What You Get Out of the Box

When you create a Lakehouse in Fabric:
- A **Delta-based storage area** (Tables/) for managed tables
- A **Files area** for raw/unstructured data
- An **automatic SQL analytics endpoint** — every Delta table in Tables/ is immediately queryable with SQL, no configuration needed
- A **default semantic model** for Power BI — tables are auto-exposed to Power BI reports

```
Fabric Lakehouse: sales_lakehouse
    ├── Tables/                    ← Delta tables (managed)
    │   ├── bronze_orders          ← queryable via SQL endpoint instantly
    │   ├── silver_orders
    │   └── gold_fact_sales
    └── Files/                     ← Raw files
        ├── raw/
        │   └── 2024/01/15/orders.csv
        └── landing/
```

---

## Loading Data — Notebooks (PySpark)

Fabric notebooks run Spark. The syntax is identical to Databricks, with one convenience: `notebookutils` and direct table references without specifying paths.

```python
# Read raw CSV from Files area
df = spark.read.csv(
    "Files/raw/2024/01/15/orders.csv",
    header=True,
    inferSchema=True
)

# Clean and type
from pyspark.sql.functions import col, to_date, current_timestamp

df_clean = df \
    .filter(col("amount").cast("double").isNotNull()) \
    .filter(col("order_id").isNotNull()) \
    .withColumn("order_date", to_date(col("order_ts"))) \
    .withColumn("_ingest_ts", current_timestamp()) \
    .dropDuplicates(["order_id"])

# Write to managed Delta table in Tables/
df_clean.write \
    .format("delta") \
    .mode("overwrite") \
    .saveAsTable("silver_orders")   # automatically in Tables/
```

After this runs, `silver_orders` is immediately available in the SQL analytics endpoint and Power BI.

---

## MERGE (Upsert) in Fabric Lakehouse

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forName(spark, "silver_orders")

delta_table.alias("t").merge(
    df_new.alias("s"),
    "t.order_id = s.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()
```

Or using SQL in a notebook cell:

```sql
MERGE INTO silver_orders AS t
USING new_orders AS s ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

---

## SQL Analytics Endpoint

Every Lakehouse automatically exposes a read-only SQL endpoint. Connect with any SQL client or query it from the Fabric UI:

```sql
-- Query directly in Fabric SQL editor
SELECT
    DATE_TRUNC('month', order_date) AS month,
    region,
    SUM(amount)                     AS revenue,
    COUNT(DISTINCT customer_id)     AS customers
FROM silver_orders
WHERE order_date >= '2024-01-01'
GROUP BY 1, 2
ORDER BY 1, 2;

-- Cross-lakehouse query (both lakehouses in same workspace)
SELECT o.order_id, c.customer_name
FROM sales_lakehouse.dbo.silver_orders o
JOIN crm_lakehouse.dbo.dim_customers c ON o.customer_id = c.customer_id;
```

---

## Lakehouse Shortcuts — No-Copy Data Access

Reference external data without ingesting it:

```
In Fabric UI:
New Shortcut → Azure Data Lake Storage Gen2
    Account: mystorageaccount
    Path: /silver/orders/

Result: shortcut appears as "orders" in Files/
→ Read via Spark: spark.read.format("delta").load("Files/orders/")
→ Queryable via SQL endpoint immediately
```

Supported shortcut sources: ADLS Gen2, S3, GCS, other Fabric Lakehouses.

---

## Medallion in Fabric

```
Files/landing/          ← raw drop zone (CSV, JSON)
    ↓ Notebook 1: ingest
Tables/bronze_orders    ← Delta, raw typed
    ↓ Notebook 2: clean
Tables/silver_orders    ← Delta, cleaned, SCD2
    ↓ Notebook 3: aggregate
Tables/gold_fact_sales  ← Delta, star schema

SQL Endpoint → Power BI Semantic Model → Dashboard
```

Each notebook is a step in a Fabric Data Pipeline or triggered by Fabric Workflow.

---

## Lakehouse vs Warehouse in Fabric

| | Lakehouse | Warehouse |
|--|-----------|-----------|
| Storage format | Delta (open) | Proprietary (internal) |
| Write via | Spark (notebook) or Dataflow | SQL INSERT / COPY |
| Read via | Spark + SQL endpoint | SQL only |
| Schema | Schema-on-read (flexible) | Schema-on-write (strict) |
| Best for | Raw + Silver layers, Spark transforms | Gold layer, BI-ready DWH |
| Cross-access | Warehouse can read Lakehouse tables | Lakehouse can't write to Warehouse |
