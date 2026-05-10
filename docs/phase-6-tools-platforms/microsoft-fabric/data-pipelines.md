---
sidebar_position: 3
---

# Fabric Data Pipelines & Dataflows

Fabric has two orchestration tools: **Data Pipelines** (code-free, ADF-identical) and **Dataflow Gen2** (Power Query-based visual transforms). Both write output to a Lakehouse or Warehouse.

---

## Data Pipelines — ADF in Fabric

Fabric Data Pipelines use the exact same UI and JSON structure as Azure Data Factory. If you know ADF, you already know Fabric Pipelines.

```
Fabric Data Pipeline activities:
    Copy Data         → move data from 100+ sources to Lakehouse/Warehouse
    Notebook          → run a Spark notebook
    Dataflow Gen2     → run a visual Power Query transform
    Execute Pipeline  → call another pipeline
    ForEach           → loop over items
    If Condition      → branch logic
    Web               → call HTTP endpoint
    Script            → run SQL
```

### Parameterized Ingestion Pipeline

```json
{
  "name": "IngestOrders",
  "parameters": {
    "run_date": { "type": "string" },
    "load_type": { "type": "string", "defaultValue": "incremental" }
  },
  "activities": [
    {
      "name": "CopyOrders",
      "type": "Copy",
      "source": {
        "type": "SqlServerSource",
        "sqlReaderQuery": "SELECT * FROM orders WHERE updated_at >= '@{pipeline().parameters.run_date}'"
      },
      "sink": {
        "type": "LakehouseTableSink",
        "tableOption": "autoCreate"
      }
    },
    {
      "name": "TransformOrders",
      "type": "FabricNotebook",
      "dependsOn": [{ "activity": "CopyOrders", "dependencyConditions": ["Succeeded"] }],
      "notebook": { "referenceName": "bronze_to_silver" },
      "parameters": {
        "run_date": { "value": "@pipeline().parameters.run_date" }
      }
    }
  ]
}
```

### Scheduling — Pipeline Triggers

```
Schedule trigger    → cron-based (daily at 6am)
Tumbling Window     → non-overlapping windows, backfill support
Storage event       → file arrives in OneLake/ADLS → trigger pipeline
Manual              → run on demand
```

---

## Dataflow Gen2 — Visual Power Query Transforms

Dataflow Gen2 is a no-code/low-code ETL tool built on Power Query (same engine as Power BI and Excel). It's best for:
- Business analysts building their own transforms
- Simple cleansing and reshaping without writing Spark code
- Connecting to sources that don't have Spark connectors

```
Dataflow Gen2 flow:
    Source (SharePoint, Excel, SQL, Salesforce, etc.)
        → Power Query editor (visual transforms: filter, pivot, merge)
        → Output destination: Lakehouse Table or Warehouse Table
```

### What Power Query Can Do

```
Filter rows         → keep only status = 'active'
Rename columns      → order_id → OrderID
Change data types   → text → decimal
Merge queries       → JOIN two tables (like SQL JOIN)
Pivot / Unpivot     → reshape wide ↔ long
Group by            → aggregate (SUM, COUNT, AVG)
Add custom column   → M language expression or simple formula
Replace values      → null → 0, "N/A" → null
```

### Dataflow Gen2 vs Notebook

| | Dataflow Gen2 | Spark Notebook |
|--|---------------|----------------|
| Skill required | Power Query (low-code) | PySpark / SQL |
| Scale | Medium (not for billions of rows) | Enterprise scale |
| Best for | Analyst-built transforms, simple ETL | Complex logic, ML, large data |
| Scheduling | Pipeline trigger or scheduled refresh | Pipeline activity or Workflow |
| Output | Lakehouse / Warehouse table | Any Delta path |

---

## Fabric Workflow — End-to-End Orchestration

Fabric Workflow (similar to Databricks Workflows) chains notebooks, pipelines, and dataflows with dependency management:

```
Workflow: daily_sales_pipeline
    Task 1: IngestOrders pipeline     (no dependency — runs first)
    Task 2: IngestProducts pipeline   (no dependency — runs first)
    Task 3: bronze_to_silver notebook (depends on Task 1 + Task 2)
    Task 4: silver_to_gold notebook   (depends on Task 3)
    Task 5: refresh_power_bi          (depends on Task 4)
```

Task 1 and 2 run in parallel. Task 3 waits for both. Power BI refresh only happens after Gold is ready.

---

## Monitoring Pipelines

Fabric has a **Monitor hub** — view run history, duration, errors, and retry details for all pipelines and notebooks in the workspace:

```
Monitor Hub → Pipeline runs
    → filter by date, status (Succeeded / Failed / In Progress)
    → click a failed run → see which activity failed and the error message
    → re-run from failure point
```

Set alerts: failed runs can send email notifications or trigger a Teams message via a Logic App webhook.
