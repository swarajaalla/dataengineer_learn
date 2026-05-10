---
sidebar_position: 1
---

# Logging for Data Pipelines

Every production pipeline must log what it did, how long it took, and what went wrong. Logging is how you debug 3am failures without access to a developer.

---

## What to Log

| Event | Log Level | What to Include |
|-------|-----------|----------------|
| Pipeline start | INFO | pipeline name, run date, triggered by |
| Step complete | INFO | step name, rows processed, duration |
| Validation pass | INFO | table name, check name, row count |
| Validation warning | WARN | table name, check name, failure rate |
| Validation failure | ERROR | table name, check name, expected vs actual |
| Pipeline complete | INFO | total rows, total duration, status |
| Exception caught | ERROR | exception type, message, stack trace |

---

## Python Logging Setup

```python
import logging
import sys

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)-8s %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

logger = get_logger("orders_pipeline")

logger.info("Starting orders ingestion for date: %s", run_date)
logger.warning("Source returned 0 rows for table: %s", table_name)
logger.error("Transformation failed: %s", str(e), exc_info=True)
```

In Databricks: logs appear in the cluster log and the notebook output.

---

## Pipeline Run Metadata Table

Store structured run metadata in a Delta table for dashboarding and alerting:

```sql
CREATE TABLE monitoring.pipeline_runs (
    run_id        STRING,
    pipeline_name STRING,
    run_date      DATE,
    start_ts      TIMESTAMP,
    end_ts        TIMESTAMP,
    status        STRING,          -- 'running', 'success', 'failed'
    rows_read     BIGINT,
    rows_written  BIGINT,
    error_message STRING,
    triggered_by  STRING
) USING DELTA;
```

```python
from datetime import datetime
import uuid

def log_run(spark, pipeline_name, run_date, status, rows_read=0, rows_written=0, error=None):
    record = [{
        "run_id": str(uuid.uuid4()),
        "pipeline_name": pipeline_name,
        "run_date": run_date,
        "start_ts": start_ts,
        "end_ts": datetime.utcnow(),
        "status": status,
        "rows_read": rows_read,
        "rows_written": rows_written,
        "error_message": str(error) if error else None,
        "triggered_by": "adf_pipeline",
    }]
    spark.createDataFrame(record).write \
        .format("delta").mode("append") \
        .saveAsTable("monitoring.pipeline_runs")
```

---

## Azure Monitor Integration

In Databricks: configure diagnostic settings to send logs to Log Analytics:

1. Go to Databricks workspace → Diagnostic settings
2. Add a diagnostic setting
3. Select categories: `clusters`, `jobs`, `notebook`
4. Destination: Log Analytics workspace

Query in Log Analytics:

```kusto
DatabricksJobs
| where TimeGenerated > ago(24h)
| where ActionName == "runFailed"
| project TimeGenerated, JobName, ErrorMessage
| order by TimeGenerated desc
```

---

## What NOT to Log

- Passwords, tokens, connection strings — use `***` or log only the key name
- Full row data with PII — log row counts, not values
- Debug-level logs in production — too noisy, expensive to store
- Every single record in a loop — log start + end + count instead
