---
sidebar_position: 2
---

# Case Study 2: Data Quality Framework with DQX

How we built an automated data quality framework using Databricks DQX to validate 200+ business rules across Silver tables and prevent bad data from reaching Gold.

---

## Problem

### Why Data Quality Matters

Without a systematic DQ framework, bad data silently reaches production reports. Common issues we encountered:

- Null values in order_id (should never be null)
- Revenue amounts as negative numbers due to ETL bugs
- Duplicate records from faulty incremental merge logic
- Status values outside the allowed enum (e.g., typos from source systems)
- Row count drops of 30%+ going undetected for days
- Cross-table referential integrity violations (order references non-existent customer)

**Impact on the business:**
- Finance reported incorrect revenue figures for Q3
- Analysts lost trust in the pipeline — manual cross-checks became routine
- Escalations to engineering increased significantly

### Why We Chose DQX

[Databricks DQX](https://github.com/databrickslabs/dqx) is an open-source data quality framework that:
- Integrates natively with PySpark
- Defines rules as Python dictionaries (easy to version control)
- Supports quarantining bad rows vs warning-only
- Produces structured output for dashboarding
- Works within existing Databricks notebooks

---

## Architecture

```
Bronze Layer (raw data)
        ↓
Silver Transformation Notebook
        ↓
DQX Validation Engine
    ├── Error rows → quarantine.{table}_dq_errors
    ├── Warning rows → flagged in silver with _dq_warning = true
    └── Clean rows → silver.{table} (promoted)
        ↓
DQ Results → monitoring.dq_results (Delta)
        ↓
Azure Monitor Alert (if critical failures exceed threshold)
        ↓
Gold Layer (only if DQ score ≥ 95%)
```

---

## Approach

### Step 1: Define Rules per Table

Rules are defined as a Python list, stored in a separate config file per table:

```python
# config/dq_rules/orders_rules.py
from databricks.labs.dqx.col_functions import (
    is_not_null, is_not_null_and_not_empty,
    value_is_in_list, is_positive,
    col_match_regex
)

ORDERS_RULES = [
    # Completeness
    {"criticality": "error",   "check": is_not_null("order_id"),      "name": "order_id_not_null"},
    {"criticality": "error",   "check": is_not_null("customer_id"),   "name": "customer_id_not_null"},
    {"criticality": "error",   "check": is_not_null("order_date"),    "name": "order_date_not_null"},

    # Validity
    {"criticality": "error",   "check": is_positive("amount"),        "name": "amount_positive"},
    {"criticality": "warning", "check": value_is_in_list("status", ["pending", "active", "completed", "cancelled"]),
                                                                       "name": "status_valid_value"},
    # Format
    {"criticality": "warning", "check": col_match_regex("order_id", r"^ORD-\d{6}$"),
                                                                       "name": "order_id_format"},
]
```

---

### Step 2: Run Validation in the Transformation Notebook

```python
from databricks.labs.dqx.engine import DQEngine
from config.dq_rules.orders_rules import ORDERS_RULES

dq_engine = DQEngine(spark)

# Apply DQ checks — returns (valid_df, error_df)
valid_df, error_df = dq_engine.apply_checks_by_metadata_and_split(
    df=df_silver_input,
    checks=ORDERS_RULES
)

# Quarantine error rows
if error_df.count() > 0:
    error_df.write.format("delta") \
        .mode("append") \
        .saveAsTable("quarantine.orders_dq_errors")

# Write only valid rows to silver
valid_df.write.format("delta") \
    .mode("overwrite") \
    .saveAsTable("silver.orders")
```

---

### Step 3: Log Results to Monitoring Table

```python
from datetime import datetime

def log_dq_results(spark, table_name, total_rows, valid_rows, error_rows, warning_rows):
    score = round(100 * valid_rows / total_rows, 2) if total_rows > 0 else 0
    record = [{
        "run_ts": datetime.utcnow(),
        "table_name": table_name,
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "error_rows": error_rows,
        "warning_rows": warning_rows,
        "dq_score": score,
        "passed": score >= 95.0,
    }]
    spark.createDataFrame(record).write \
        .format("delta").mode("append") \
        .saveAsTable("monitoring.dq_results")

    # Block Gold promotion if score below threshold
    if score < 95.0:
        raise ValueError(
            f"DQ check failed for {table_name}: score={score}%, threshold=95%"
        )
```

---

### Step 4: Gold Promotion Gate

The Gold transformation notebook reads from Silver only after DQ passes:

```python
# Check DQ score before promoting to Gold
dq_score = spark.sql(f"""
    SELECT dq_score FROM monitoring.dq_results
    WHERE table_name = 'silver.orders'
    AND DATE(run_ts) = CURRENT_DATE()
    ORDER BY run_ts DESC LIMIT 1
""").collect()[0][0]

if dq_score < 95.0:
    dbutils.notebook.exit(f"SKIPPED: DQ score {dq_score}% below 95% threshold")

# Proceed with Gold aggregations
df_gold = spark.table("silver.orders") \
    .groupBy("region", "order_date") \
    .agg(...)
```

---

## Challenges

### 1. Rule Explosion
Having 200+ rules across 30 tables was hard to manage. We resolved it by:
- Splitting rules into per-table config files
- Creating shared base rules (completeness checks) that apply to all tables
- Using a metadata-driven approach — rules stored in a Delta table, loaded at runtime

### 2. False Positives
Some rules initially had too many warnings (e.g., address format check was too strict). We tuned thresholds and moved strict checks to `warning` criticality before escalating to `error`.

### 3. Performance Impact
Running DQ checks on 100M+ row Silver tables added ~8 minutes to the pipeline. Resolution:
- Moved statistical checks (row count, null rates) to aggregated summaries instead of row-level
- Run row-level checks only on incremental records (new rows only)
- Cache the DataFrame before applying checks if used downstream

### 4. Quarantine Recovery
Initially had no process to fix and reprocess quarantined rows. Built a separate `quarantine_recovery_notebook` that:
- Shows quarantined rows with error reasons
- Applies manual corrections
- Re-runs through the DQ engine before inserting into Silver

---

## Outcome

| Metric | Before DQ Framework | After |
|--------|---------------------|-------|
| Data issues detected | Manually, after business complaint | Automatically, before Gold |
| Time to detect bad data | Days | Minutes |
| Trust score (analyst survey) | Low | High |
| Gold table error rate | ~3% monthly | < 0.2% |
| Escalations to engineering | 8/month | 1/month |

---

## Key Takeaways

- **Define "good data" before the pipeline, not after** — rules should come from business stakeholders
- **Quarantine, don't discard** — bad rows need to be fixed and reloaded, not silently dropped
- **Score, don't just pass/fail** — a 98% DQ score is different from 85%; both might pass a binary check
- **Row-level checks are expensive** — use sampling or aggregated statistics for large tables
- **DQ is a product, not a project** — rules evolve as business rules change. Treat them like code.

---

## What We'd Add Next

- dbt tests for Gold layer (schema tests, uniqueness, referential integrity)
- Anomaly detection (ML-based) for statistical drift
- Power BI dashboard reading from `monitoring.dq_results`
- Automated Slack alerts when DQ score drops below threshold
