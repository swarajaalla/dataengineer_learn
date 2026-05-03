
---

# 🔹 2. ETL (this is your differentiator)

### `etl.md`

```md
# ETL in Azure + Databricks (Real-world View)

ETL is not just moving data.
It’s about building reliable, scalable pipelines.

---

## Typical Architecture

Source → ADF → ADLS → Databricks → Delta Tables → BI

---

## Step 1: Ingestion (ADF)

- Pull from:
  - SAP
  - APIs
  - CSV / SharePoint

Key concepts:
- Incremental loads
- Parameterized pipelines
- Logging & retry

---

## Step 2: Storage (ADLS)

Use layered architecture:

- Bronze → Raw data
- Silver → Cleaned data
- Gold → Business-ready

---

## Step 3: Transformation (Databricks)

Using PySpark / SQL:

```python
df = spark.read.format("delta").load("/mnt/bronze/sales")

df_clean = df.dropDuplicates(["id"])

df_clean.write.format("delta").mode("overwrite").save("/mnt/silver/sales")