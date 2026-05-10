---
sidebar_position: 2
---

# ETL vs ELT

The order of transformation defines your architecture. Modern cloud data engineering is almost always ELT.

---

## ETL — Extract, Transform, Load

Transform data **before** loading it to the target.

```
Source → [Extract] → [Transform in ETL tool] → [Load to warehouse]
```

| Property | Detail |
|----------|--------|
| **Where transform happens** | Outside the target — in ETL server/tool |
| **Tools** | SSIS, Informatica, Talend, AWS Glue (ETL mode) |
| **Best for** | Legacy systems, strict pre-processing, regulated data |
| **Weakness** | Raw data is discarded after transformation |

**The ETL problem:** If your transformation logic was wrong, you have no raw data to reprocess. You must re-extract from source, which may be expensive, slow, or impossible if the source has changed.

---

## ELT — Extract, Load, Transform

Load raw data first. Transform **inside** the warehouse or lake.

```
Source → [Extract] → [Load raw to lake] → [Transform in Spark/dbt/SQL]
```

| Property | Detail |
|----------|--------|
| **Where transform happens** | Inside the target — warehouse, lake, or lakehouse |
| **Tools** | Databricks, dbt, Synapse, BigQuery |
| **Best for** | Modern cloud stacks, large volumes, ML workloads |
| **Benefit** | Raw data always preserved — reprocess any time |

---

## Why Modern DE Shifted to ELT

**1. Cloud compute is cheap and scalable**
Running Spark on a 32-node cluster to process 10 TB is possible and cost-effective. Pre-transformation on a single ETL server was necessary when you couldn't afford warehouse compute.

**2. Raw data preservation**
Bronze = full audit trail. If Silver processing logic was wrong, re-run the Silver notebook from Bronze. No re-extraction needed.

**3. Exploratory access**
Data scientists can access raw Bronze data before transformation is complete. Exploration doesn't wait for the ETL process.

**4. Separation of concerns**
ADF (ingestion tool) focuses only on copying. Databricks (transformation tool) focuses only on logic. Each does one thing well.

**5. dbt and SQL-first transformation**
dbt brings software engineering practices (version control, testing, documentation) to SQL transformations. It only works with ELT — data must be in the warehouse first.

---

## When ETL Still Makes Sense

**PII masking before landing:**
```
Source (contains SSNs, credit card numbers)
  → ETL step: mask/tokenize PII
  → Bronze (masked data lands)
```
If regulations prohibit raw PII from touching the lake, you must mask before landing. This is a valid ETL use case.

**Legacy on-premise pipelines:**
SSIS and stored procedures in SQL Server are common in organizations that migrated to the cloud but kept on-prem transformation logic. Modernizing these takes time.

**Real-time transformation:**
Kafka Streams, Flink, Spark Structured Streaming — transforming data in-flight before it even lands. Technically ETL (transform before storing), but a different paradigm entirely.

---

## Practical ELT Pattern on Azure

```
SAP ERP (source)
         ↓
ADF Copy Activity
(E = Extract from SAP, L = Load to ADLS)
No transformation here — pure copy
         ↓
ADLS Bronze (raw SAP data, as CSV/Parquet)
         ↓
Databricks Notebook — Bronze to Silver
(T = Transform: type cast, dedup, validate, standardize)
         ↓
ADLS Silver (Delta — clean, typed, validated)
         ↓
Databricks Notebook — Silver to Gold
(T = Transform: star schema, SCD2, aggregations)
         ↓
ADLS Gold (Delta — business-ready, star schema)
         ↓
Power BI / Databricks SQL
```

ADF does the **E** and **L**. Databricks does the **T**. Two tools, two responsibilities.

---

## dbt: ELT in a Warehouse

dbt (data build tool) is the SQL version of ELT. It runs `SELECT` statements inside your warehouse and materializes them as tables or views:

```sql
-- models/silver/orders_clean.sql
SELECT
    order_id,
    CAST(order_date AS DATE) AS order_date,
    UPPER(TRIM(customer_name)) AS customer_name,
    COALESCE(order_total, 0) AS order_total
FROM {{ source('bronze', 'raw_orders') }}
WHERE order_id IS NOT NULL
```

dbt compiles this, runs it in Databricks/Snowflake, and materializes the result as `silver.orders_clean`. No Python, no Spark — pure SQL.

---

## Tool Decision

| Factor | Use ETL | Use ELT |
|--------|---------|---------|
| Must mask PII before landing | Yes | No |
| Source is on-prem SQL Server with SSIS | Yes | No |
| Raw data preservation needed | No | Yes |
| Team knows SQL / Python | No | Yes |
| Large data volumes | No | Yes |
| ML team needs raw access | No | Yes |
| Using Databricks / Snowflake | No | Yes |
