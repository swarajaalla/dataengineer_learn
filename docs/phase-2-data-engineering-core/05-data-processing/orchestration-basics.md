---
sidebar_position: 5
---

# Orchestration Basics

Orchestration is the scheduling and dependency management for data pipelines. Without it, you have isolated notebooks; with it, you have a reliable data platform.

---

## What Orchestration Does

- **Scheduling:** Trigger pipelines at the right time (nightly, hourly, on file arrival)
- **Dependency management:** Run Silver processing only after Bronze ingestion succeeds
- **Retries:** Automatically retry failed tasks with configurable backoff
- **Alerting:** Notify via email/Teams/Slack when pipelines fail
- **Monitoring:** Track run history, duration, and success rates
- **Parallelism:** Run independent tasks concurrently to reduce total run time

---

## DAG: The Core Concept

A DAG (Directed Acyclic Graph) represents a pipeline as a graph of tasks with dependencies.

```
ingest_sap_orders
       ↓
clean_orders (Silver)
       ↓
     ┌─────────────────────┐
     ↓                     ↓
build_fact_orders    build_dim_product
     ↓                     ↓
     └──────── Gold ────────┘
                   ↓
           refresh_power_bi
```

**Directed:** Arrows show execution order.
**Acyclic:** No circular dependencies (A → B → A is not allowed — infinite loop).

---

## Orchestration Tools

| Tool | Type | Best for | Complexity |
|------|------|---------|-----------|
| **Azure Data Factory** | Managed, GUI | Azure-native, multi-source pipelines | Low–Medium |
| **Databricks Workflows** | Managed, code-first | Databricks-only pipelines, notebooks/jobs | Low–Medium |
| **Apache Airflow** | Open-source, Python | Complex DAGs, custom operators, any platform | High |
| **Prefect** | Open-source/cloud | Python-first, modern alternative to Airflow | Medium |
| **Azure Logic Apps** | Managed, low-code | Simple event-driven workflows | Low |

**Rule of thumb:**
- Azure-only, no Airflow experience → ADF
- All processing in Databricks → Databricks Workflows
- Multi-platform, Python team, complex dependencies → Airflow

---

## Azure Data Factory Orchestration

**Trigger types:**
```
Schedule Trigger   → runs at fixed time (daily 1 AM)
Tumbling Window    → time-partitioned runs, backfill-aware
Event Trigger      → fires on file arrival in ADLS
Manual Trigger     → one-off runs
```

**Activity dependencies:**
```
Copy Activity (SAP extract)
    ↓ on success
Databricks Activity (Silver notebook)
    ↓ on success          ↓ on failure
Databricks Activity    Email Activity
(Gold notebook)        (alert team)
```

**Control flow activities:**
- `ForEach` — loop over a list (e.g., all source tables)
- `If Condition` — branch based on a result
- `Until` — loop until condition is met
- `Execute Pipeline` — call another pipeline (modularize)

---

## Databricks Workflows

Databricks-native orchestration for notebook and job execution.

```json
// Workflow definition (simplified)
{
  "name": "daily_sap_pipeline",
  "tasks": [
    {
      "task_key": "ingest_bronze",
      "notebook_task": {"notebook_path": "/pipelines/bronze/sap_orders"}
    },
    {
      "task_key": "process_silver",
      "depends_on": [{"task_key": "ingest_bronze"}],
      "notebook_task": {"notebook_path": "/pipelines/silver/orders_clean"}
    },
    {
      "task_key": "build_gold",
      "depends_on": [{"task_key": "process_silver"}],
      "notebook_task": {"notebook_path": "/pipelines/gold/fact_orders"}
    }
  ],
  "schedule": {
    "quartz_cron_expression": "0 0 2 * * ?",  // 2 AM daily
    "timezone_id": "Europe/Berlin"
  }
}
```

---

## Apache Airflow DAG

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.databricks.operators.databricks import DatabricksRunNowOperator
from datetime import datetime, timedelta

default_args = {
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": True,
    "email": ["data-alerts@company.com"]
}

with DAG(
    dag_id="sap_daily_pipeline",
    default_args=default_args,
    schedule_interval="0 2 * * *",  # 2 AM daily
    start_date=datetime(2024, 1, 1),
    catchup=False  # don't backfill missed runs
) as dag:
    
    ingest_bronze = DatabricksRunNowOperator(
        task_id="ingest_sap_bronze",
        databricks_conn_id="databricks_prod",
        job_id=1001
    )
    
    process_silver = DatabricksRunNowOperator(
        task_id="process_silver",
        databricks_conn_id="databricks_prod",
        job_id=1002
    )
    
    build_gold = DatabricksRunNowOperator(
        task_id="build_gold",
        databricks_conn_id="databricks_prod",
        job_id=1003
    )
    
    ingest_bronze >> process_silver >> build_gold
```

---

## Key Orchestration Concepts

**Idempotency:** Every task should be re-runnable without side effects. If a task fails and reruns, the result is the same.

**SLAs:** Define the maximum acceptable time for a pipeline to complete. Airflow can alert if an SLA is breached.

**Backfill:** Re-run historical pipeline runs (Airflow supports this natively with `catchup=True`).

**Sensors:** Wait for an external condition before proceeding.
```python
from airflow.sensors.filesystem import FileSensor

wait_for_file = FileSensor(
    task_id="wait_for_sap_export",
    filepath="/bronze/incoming/sap_export_*.csv",
    timeout=3600,       # fail if file doesn't arrive within 1 hour
    poke_interval=300   # check every 5 minutes
)
```

---

## ADF vs Databricks Workflows vs Airflow

| Scenario | Best choice |
|----------|------------|
| All sources on Azure, mixed tools | ADF |
| All processing in Databricks notebooks/jobs | Databricks Workflows |
| Multi-cloud, complex Python logic in DAGs | Airflow |
| Need Airflow but don't want to manage it | Azure Managed Airflow (MWAA equivalent is limited — use ASTRO or self-hosted) |
| Simple event-based triggers | ADF Event Trigger |
