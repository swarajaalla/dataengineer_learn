---
sidebar_position: 2
---

# Error Handling for Pipelines

Pipelines must handle failures gracefully, log them with context, and recover automatically. Silent failures cause data loss.

---

## Basic Try/Except

```python
try:
    result = fetch_data(url)
except Exception as e:
    print(f"Error: {e}")  # Too broad — catches everything, hides root cause
```

Always catch specific exceptions:

```python
import requests

try:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.json()
except requests.Timeout:
    raise RuntimeError(f"Request timed out after 30s: {url}")
except requests.HTTPError as e:
    raise RuntimeError(f"HTTP {e.response.status_code} from {url}: {e}")
except requests.RequestException as e:
    raise RuntimeError(f"Request failed for {url}: {e}")
```

---

## Logging (Use This, Not Print)

```python
import logging

# Setup (do this once at module level)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Usage
logger.info("Starting orders ingestion for date: %s", run_date)
logger.warning("Source returned 0 rows — possible issue: %s", source_name)
logger.error("Pipeline failed: %s", str(error), exc_info=True)
```

`exc_info=True` includes the full stack trace in the log — always use it for errors.

---

## Retry with Exponential Backoff

```python
import time
import logging
import requests

logger = logging.getLogger(__name__)

def fetch_with_retry(url: str, headers: dict, max_retries: int = 3) -> dict:
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            if attempt == max_retries - 1:
                raise RuntimeError(f"All {max_retries} attempts failed for {url}") from e
            wait = 2 ** attempt  # 1s, 2s, 4s
            logger.warning("Attempt %d failed, retrying in %ds: %s", attempt + 1, wait, e)
            time.sleep(wait)
```

---

## Custom Exceptions for Pipelines

```python
class PipelineError(Exception):
    """Base class for pipeline failures."""

class DataQualityError(PipelineError):
    """Raised when data quality checks fail."""

class SourceUnavailableError(PipelineError):
    """Raised when source system is unreachable."""


def validate_record_count(df, table_name: str, min_count: int = 1):
    count = df.count()
    if count < min_count:
        raise DataQualityError(
            f"Table {table_name} has {count} rows — expected at least {min_count}"
        )
    logger.info("Record count OK: %s has %d rows", table_name, count)
```

---

## Context Managers for Resources

```python
# Database connections — always close them
with pyodbc.connect(conn_str) as conn:
    df = pd.read_sql(query, conn)
# Connection automatically closed even if an error occurs

# File handling
with open("data.json") as f:
    data = json.load(f)
```

---

## Pipeline Run Logging to a Table

Log every pipeline run to a metadata table for monitoring:

```python
from datetime import datetime

def log_pipeline_run(spark, pipeline_name: str, status: str, rows_loaded: int, error: str = None):
    record = [{
        "pipeline_name": pipeline_name,
        "run_ts": datetime.utcnow().isoformat(),
        "status": status,
        "rows_loaded": rows_loaded,
        "error_message": error,
    }]
    spark.createDataFrame(record).write \
        .format("delta") \
        .mode("append") \
        .saveAsTable("monitoring.pipeline_runs")
```
