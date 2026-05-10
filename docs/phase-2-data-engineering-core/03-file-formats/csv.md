---
sidebar_position: 2
---

# CSV

CSV (Comma-Separated Values) is the most universally supported data format. Every system can read and write it — which is both its strength and its limitation.

---

## What It Is

A plain text file where each row is a record and columns are separated by a delimiter (comma, pipe, tab, semicolon). No types, no schema, no compression by default.

```csv
customer_id,name,email,country,revenue
1001,Acme Corp,contact@acme.com,DE,142000.50
1002,Beta Ltd,,UK,89200.00
1003,Gamma GmbH,info@gamma.de,DE,
```

---

## Why It's Still Everywhere

- **Universal** — every system (Excel, SAP, SQL Server, Python, Spark) can read/write it
- **Human-readable** — you can open it in a text editor and understand it
- **Zero tooling required** — no schema registry, no special reader
- **Source system exports** — SAP, Dynamics, Oracle all export to CSV

It's not going away. Data engineers will work with CSVs forever.

---

## Real Limitations

**No schema:** CSV has no data types. Every value is a string. You have to cast at read time.
```python
# This column looks like a number — it's not
df = spark.read.csv("orders.csv", header=True)
df.printSchema()
# order_total: string ← always string with CSV
df = df.withColumn("order_total", col("order_total").cast("double"))
```

**Not splittable (when compressed):** A gzip-compressed CSV is one block — Spark reads it on a single executor. No parallelism.
```
gzip CSV (1 executor reads entire file) vs Parquet (100 executors read 100 row groups)
```

**Encoding issues:** Windows systems write CP-1252, Linux expects UTF-8. German umlauts (ä, ö, ü) break silently.

**Special character nightmares:**
```csv
"1001","Acme, Corp","This is a ""quoted"" description",DE
# Commas in values → need quoting
# Quotes in values → need escaping
# Newlines in values → breaks row parsing entirely
```

**No nested structure:** Can't represent arrays or objects — JSON or Parquet required.

---

## When CSV Is Acceptable

- Source system has no other export option
- File is small (< 1 GB)
- One-time data exchange with external teams
- Landing in Bronze (keep as-is, convert later)

---

## When CSV Is a Problem

- File is > 10 GB — read time will be slow, no parallelism with gzip
- Analytical queries — columnar format is 10-100x faster
- Schema changes in source — no way to detect without parsing
- Production pipelines — type ambiguity causes silent errors

---

## ADF: Reading CSVs Correctly

Key settings in ADF Copy Activity / Dataset:
- **First row as header:** Yes
- **Encoding:** UTF-8 (not UTF-8 with BOM — BOM adds invisible characters that break column names)
- **Quote character:** `"` (double quote — handles embedded commas)
- **Escape character:** `"` (double-quote escape for embedded quotes)
- **Null value:** empty string or custom (`\N`, `NULL`)

---

## PySpark: Reading CSV

```python
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true")  \   # avoid — reads entire file twice
    .option("encoding", "UTF-8") \
    .option("quote", '"') \
    .option("escape", '"') \
    .option("nullValue", "") \
    .csv("abfss://bronze@account.dfs.core.windows.net/sap/sales/")

# Better: define schema explicitly — faster and deterministic
from pyspark.sql.types import *

schema = StructType([
    StructField("order_id", StringType()),
    StructField("customer_id", LongType()),
    StructField("order_date", DateType()),
    StructField("order_total", DoubleType()),
])

df = spark.read.schema(schema).option("header", "true").csv(path)
```

---

## Common Issues and Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| BOM in UTF-8 | Column name has `ï»¿` prefix | Read as `UTF-8-BOM` or strip BOM |
| Comma in field | Row parsing broken | Ensure fields are quoted |
| Windows line endings | `\r\n` in values | `.option("lineSep", "\r\n")` |
| Mixed date formats | Date parsing fails | Cast to string, parse manually |
| Empty file | No rows read | Check for empty file before processing |

---

## Convert CSV to Parquet (Bronze → Silver)

```python
# Read raw CSV from Bronze
df = spark.read.schema(schema).option("header", "true") \
    .csv("abfss://bronze@account.dfs.core.windows.net/sap/orders/")

# Write as Delta to Silver
df.write \
    .format("delta") \
    .mode("overwrite") \
    .partitionBy("order_year", "order_month") \
    .save("abfss://silver@account.dfs.core.windows.net/sap_orders/")
```

Do this conversion as early as possible. Keep the original CSV in Bronze untouched.
