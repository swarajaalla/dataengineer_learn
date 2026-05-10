---
sidebar_position: 2
---

# Azure Data Factory (ADF)

ADF is the primary ETL/orchestration service in Azure. It connects to 90+ source systems and orchestrates your data pipelines.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Linked Service** | Connection definition — credentials + endpoint for a source/sink |
| **Dataset** | Schema/path definition for data |
| **Pipeline** | Workflow of activities |
| **Activity** | Single operation — Copy Data, Notebook, Web, Stored Procedure |
| **Trigger** | What starts a pipeline — schedule, event, tumbling window |
| **Integration Runtime** | Compute that runs activities — Azure IR or Self-Hosted IR |

---

## Activity Types

```
Copy Data         → Move data between source and sink (ADF's main activity)
Databricks Notebook → Run a Databricks notebook
Execute Pipeline   → Call another pipeline
ForEach           → Loop over items in parallel or sequentially
If Condition      → Branch based on expression
Until             → Loop until a condition is true
Web               → Call an HTTP endpoint
Stored Procedure  → Run a database stored procedure
```

---

## Parameterized Pipeline (Key Pattern)

One pipeline handles 50 source tables by accepting parameters:

```json
{
  "name": "generic_ingestion_pipeline",
  "parameters": {
    "source_table": {"type": "String"},
    "target_path": {"type": "String"},
    "watermark_column": {"type": "String", "defaultValue": "updated_at"},
    "load_type": {"type": "String", "defaultValue": "incremental"}
  },
  "activities": [
    {
      "name": "CopyFromSource",
      "type": "Copy",
      "inputs": [{"referenceName": "ds_source", "parameters": {"table_name": {"value": "@pipeline().parameters.source_table"}}}],
      "outputs": [{"referenceName": "ds_adls", "parameters": {"path": {"value": "@pipeline().parameters.target_path"}}}]
    }
  ]
}
```

Run this pipeline with a ForEach over a lookup table of source tables.

---

## Trigger Types

```
Schedule Trigger       → Fixed cron schedule (daily at 6am)
Tumbling Window        → Non-overlapping windows, supports backfill (best for incremental)
Event Trigger          → Fires when file arrives in ADLS (blob created/deleted event)
Manual                 → On-demand from UI or API
```

For incremental daily pipelines, use **Tumbling Window** — it tracks each window independently and supports reprocessing specific windows.

---

## ADF + Databricks Integration

```
ADF Pipeline
    → Databricks Notebook Activity
        → Cluster: job cluster (cost-efficient, starts fresh)
        → Notebook path: /notebooks/transform_orders
        → Parameters: {"run_date": "@trigger().startTime", "env": "prod"}
```

In the Databricks notebook:

```python
dbutils.widgets.text("run_date", "")
dbutils.widgets.text("env", "dev")

run_date = dbutils.widgets.get("run_date")
env = dbutils.widgets.get("env")
```

---

## Self-Hosted Integration Runtime (SHIR)

When your source is on-premises (SQL Server, SAP, Oracle), ADF can't reach it over the internet.

Install SHIR on a VM inside your corporate network:

```
ADF (Azure) → SHIR (on-prem VM) → SQL Server (on-prem)
```

SHIR acts as a bridge between cloud ADF and on-premise sources.

---

## Error Handling

Every activity has three outcome paths: **Success**, **Failure**, **Completion** (always).

Best practice: Add a Failure path to critical activities that sends an alert:

```
Copy Activity
    → (on Success) → Next Step
    → (on Failure) → Web Activity (POST to Teams webhook with error details)
```
