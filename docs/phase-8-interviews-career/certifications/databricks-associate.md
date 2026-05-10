---
sidebar_position: 3
---

# Databricks Certified Data Engineer Associate

The entry-level Databricks certification. Validates practical Spark, Delta Lake, and Databricks Workflows knowledge. Widely recognised in the industry and a solid first Databricks cert.

---

## What It Covers

| Domain | Weight |
|--------|--------|
| Databricks Lakehouse Platform | 24% |
| ELT with Spark and Delta Lake | 29% |
| Incremental data processing | 22% |
| Production pipelines | 16% |
| Data governance | 9% |

**Core topics:**

- Databricks workspace, clusters, notebooks, repos
- Spark DataFrames — read, write, transform, aggregate
- Delta Lake — ACID transactions, time travel, MERGE, OPTIMIZE, VACUUM, schema evolution
- Spark SQL — window functions, CTEs, aggregations
- Databricks Workflows — tasks, dependencies, triggers
- Delta Live Tables (DLT) — declarative pipelines, expectations
- Unity Catalog — catalog/schema/table hierarchy, access control

---

## Exam Format

- Duration: 90 minutes
- Questions: 45 multiple choice
- Passing score: 70% (approximately 32/45)
- Cost: $200 USD
- Valid for: 2 years

---

## Study Resources

| Resource | Cost | Notes |
|----------|------|-------|
| Databricks Academy — free learning paths | Free | Official, use "Data Engineer Learning Path" |
| Databricks Community Edition | Free | Free Spark cluster for practice |
| Udemy (Derar Alhussein) | ~$15 | Best structured course with practice exams |
| Official practice exam (Databricks) | Free | On the certification page — do it first |

---

## Key Topics to Focus On

**Delta Lake operations — most tested:**
```sql
-- Time travel
SELECT * FROM silver.orders VERSION AS OF 5;
SELECT * FROM silver.orders TIMESTAMP AS OF '2024-01-01';
RESTORE TABLE silver.orders TO VERSION AS OF 10;

-- Maintenance
OPTIMIZE silver.orders;
OPTIMIZE silver.orders ZORDER BY (customer_id);
VACUUM silver.orders RETAIN 168 HOURS;

-- Schema evolution
ALTER TABLE silver.orders ADD COLUMN payment_method STRING;
-- Or on write: .option("mergeSchema", "true")

-- MERGE
MERGE INTO silver.orders AS t
USING updates AS s ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

**Delta Live Tables (DLT) — commonly tested:**
```python
import dlt
from pyspark.sql.functions import col

@dlt.table(
    comment="Cleaned orders from bronze"
)
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
def silver_orders():
    return (
        dlt.read("bronze_orders")
           .filter(col("passenger_count") > 0)
           .withColumn("order_date", col("order_ts").cast("date"))
    )
```

**Cluster types — often tested:**
- All-Purpose: interactive, shared, always-on — for development
- Job Cluster: created per job run, terminates after — for production (cheaper)
- SQL Warehouse: for BI/SQL queries — serverless or classic

**Commonly missed:**
- `display()` vs `show()` — Databricks-specific vs standard Spark
- Delta table history — `DESCRIBE HISTORY table_name`
- Auto Loader — `cloudFiles` format for incremental file ingestion
- Photon engine — when it applies (SQL and Delta operations, not Python UDFs)

---

## Sample Questions

**Q: You ran VACUUM on a Delta table. A user tries to query VERSION AS OF 5 and gets an error. Why?**  
A: VACUUM deleted files older than the retention period. The old version files no longer exist. Always set `RETAIN >= 168 HOURS` to keep 7 days of history.

**Q: What is the difference between `@dlt.table` and `@dlt.view` in Delta Live Tables?**  
A: `@dlt.table` materialises the result as a Delta table (stored, queryable). `@dlt.view` is computed at query time — not stored — used for intermediate logic.

**Q: Which cluster type should you use for a nightly Databricks Workflow job?**  
A: Job cluster — created fresh for each run, auto-terminates after, no idle cost. All-purpose clusters stay running and accumulate idle cost.
