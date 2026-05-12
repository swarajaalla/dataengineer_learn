---
sidebar_position: 5
---

# Azure Data Factory (ADF)

Azure Data Factory (ADF) is Azure’s cloud-native ETL/ELT and orchestration service used to ingest, move, transform, and schedule data pipelines at scale.

ADF connects to 90+ source systems and orchestrates end-to-end data workflows across Azure, on-premise, and multi-cloud environments.

---

# Why ADF?

ADF is mainly used for:
- Data ingestion
- Workflow orchestration
- Scheduling pipelines
- Hybrid data movement
- Incremental loading
- Metadata-driven pipelines
- Calling external services
- Enterprise ETL automation

---

# Core Concepts

| Concept | Description |
|---|---|
| **Linked Service** | Connection definition — credentials + endpoint for a source/sink |
| **Dataset** | Schema/path definition for data |
| **Pipeline** | Workflow of activities |
| **Activity** | Single operation — Copy Data, Notebook, Web, Stored Procedure |
| **Trigger** | What starts a pipeline — schedule, event, tumbling window |
| **Integration Runtime** | Compute that runs activities — Azure IR or Self-Hosted IR |
| **Data Flow** | Visual transformation layer inside ADF |
| **Parameter** | Dynamic value passed into pipelines/datasets |
| **Variable** | Runtime value used within pipeline execution |

---

# ADF Architecture

```text
Source Systems
      ↓
Linked Services
      ↓
Datasets
      ↓
Pipeline Activities
      ↓
Target Systems
```

---

# Activity Types

```text
Copy Data            → Move data between source and sink
Databricks Notebook  → Run a Databricks notebook
Execute Pipeline     → Call another pipeline
Lookup               → Read metadata/configuration rows
ForEach              → Loop over items in parallel or sequentially
If Condition         → Branch based on expression
Switch               → Multi-condition branching
Until                → Loop until condition becomes true
Web                  → Call HTTP endpoint/API
Stored Procedure     → Execute DB stored procedure
Set Variable         → Store runtime values
Get Metadata         → Read file/table metadata
Validation           → Wait/check if file exists
Delete               → Delete files/folders
Filter               → Filter array items
Wait                 → Pause pipeline execution
Fail                 → Explicitly fail pipeline
```

---

# Linked Service

Defines how ADF connects to external systems.

Examples:
- Azure SQL Database
- ADLS Gen2
- SAP
- Oracle
- Databricks
- Snowflake
- REST APIs

Example:
```text
ADF → Linked Service → SQL Server
```

---

# Dataset

Datasets define:
- File path
- Table
- Schema
- Format

Examples:
- CSV file in ADLS
- SQL table
- JSON API response

---

# Parameterized Pipeline (Key Enterprise Pattern)

Instead of building 100 pipelines, build one reusable pipeline.

One pipeline handles multiple source tables dynamically using parameters.

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
      "inputs": [
        {
          "referenceName": "ds_source",
          "parameters": {
            "table_name": {
              "value": "@pipeline().parameters.source_table"
            }
          }
        }
      ],
      "outputs": [
        {
          "referenceName": "ds_adls",
          "parameters": {
            "path": {
              "value": "@pipeline().parameters.target_path"
            }
          }
        }
      ]
    }
  ]
}
```

Run this pipeline with:
- Lookup Activity
- Config table
- ForEach loop

This is called a **metadata-driven framework**.

---

# Dynamic Content Expressions

ADF uses expressions for dynamic runtime behavior.

Examples:

```text
@pipeline().parameters.table_name
@utcnow()
@trigger().startTime
@item().table_name
```

Used heavily in:
- Dynamic file paths
- Incremental loads
- Reusable pipelines
- Partitioning

---

# Trigger Types

```text
Schedule Trigger  → Fixed cron schedule
Tumbling Window   → Incremental window-based processing
Event Trigger     → Trigger on file arrival
Manual Trigger    → Run on-demand
```

---

# Tumbling Window Trigger

Best trigger for:
- Incremental loads
- Batch processing
- Backfills
- Recovery/reprocessing

Advantages:
- Tracks each window independently
- Prevents overlapping runs
- Supports dependency chaining
- Easier recovery

Example:
```text
Daily load for:
2026-01-01
2026-01-02
2026-01-03
```

Each window is tracked separately.

---

# Incremental Load Pattern

Instead of loading full tables daily:

```text
SELECT * 
FROM orders
WHERE updated_at > last_watermark
```

Benefits:
- Faster pipelines
- Lower compute cost
- Reduced network usage

Common watermark columns:
- updated_at
- created_date
- modified_timestamp
- CDC sequence number

---

# Copy Activity

Most important ADF activity.

Used for:
- Source → Sink movement
- Batch ingestion
- File movement
- Hybrid connectivity

Example:
```text
SQL Server → ADLS
SAP → Blob Storage
REST API → SQL Database
```

---

# Mapping Data Flow

ADF visual transformation engine.

Used for:
- Joins
- Aggregations
- Derived columns
- Filters
- Data cleansing

Runs on Spark clusters managed by ADF.

Important:
For large enterprise transformations, Databricks is usually preferred over Mapping Data Flow.

---

# ADF + Databricks Integration

ADF orchestrates Databricks jobs.

```text
ADF Pipeline
    ↓
Databricks Notebook Activity
    ↓
Spark Transformations
    ↓
ADLS / Delta Tables
```

Notebook parameters:

```text
run_date
environment
load_type
batch_id
```

Example:

```python
dbutils.widgets.text("run_date", "")
dbutils.widgets.text("env", "dev")

run_date = dbutils.widgets.get("run_date")
env = dbutils.widgets.get("env")
```

---

# Self-Hosted Integration Runtime (SHIR)

When sources are inside corporate/private networks, Azure cannot access them directly.

Install SHIR on a VM:

```text
ADF (Azure)
      ↓
SHIR (On-Prem VM)
      ↓
SQL Server / SAP / Oracle
```

Used for:
- On-prem SQL Server
- SAP ECC
- Oracle
- Private network sources

---

# Integration Runtime Types

| Type | Usage |
|---|---|
| Azure IR | Cloud-native activities |
| Self-Hosted IR | On-prem connectivity |
| Azure SSIS IR | Lift-and-shift SSIS packages |

---

# Pipeline Concurrency

ADF supports parallel execution.

Example:
```text
ForEach → Batch Count = 10
```

This runs 10 activities in parallel.

Important for:
- Faster ingestion
- Large table processing
- Optimizing runtime

Be careful:
Too much parallelism can overload source systems.

---

# Error Handling

Every activity has:
- Success path
- Failure path
- Completion path

Example:

```text
Copy Activity
    → Success → Next Activity
    → Failure → Send Alert
    → Completion → Audit Logging
```

---

# Retry Policy

ADF activities support retries.

Example:
```text
Retry Count = 3
Retry Interval = 30 seconds
```

Useful for:
- Temporary network failures
- API throttling
- Timeout issues

---

# Logging & Monitoring

ADF monitoring features:
- Pipeline runs
- Activity runs
- Trigger history
- Error tracking

Best Practice:
Store logs in:
- Log Analytics
- SQL tables
- ADLS audit layer

---

# Common Enterprise Design Patterns

## 1. Metadata-Driven Pipelines
Single reusable pipeline for multiple tables.

---

## 2. Bronze-Silver-Gold Architecture

```text
Source
   ↓
Bronze (Raw)
   ↓
Silver (Cleaned)
   ↓
Gold (Business Ready)
```

---

## 3. Config-Driven Framework

Store configurations in:
- SQL table
- JSON
- CSV

Pipeline reads configs dynamically.

---

# Security Best Practices

## Use Managed Identity
Avoid storing secrets inside pipelines.

---

## Use Azure Key Vault
Store:
- Passwords
- Secrets
- Connection strings

---

## Use RBAC
Grant least-privilege access.

---

## Use Private Endpoints
Avoid public internet exposure.

---

# Performance Optimization

## Best Practices
- Use parallel copy
- Partition large tables
- Avoid tiny files
- Use compression
- Push transformations to Spark
- Use staging for large loads
- Tune DIUs (Data Integration Units)

---

# Cost Optimization

ADF billing depends on:
- Pipeline orchestration
- Activity runtime
- Data movement
- Mapping Data Flow clusters

Cost reduction tips:
- Use Auto Termination
- Avoid unnecessary triggers
- Use Databricks job clusters
- Minimize Mapping Data Flow usage

---

# Real-World Enterprise Flow

```text
SAP / SQL Server / APIs
            ↓
ADF Ingestion Pipelines
            ↓
ADLS Bronze Layer
            ↓
Databricks Transformations
            ↓
ADLS Silver / Gold
            ↓
Synapse / Power BI
```

---

# Common Interview Questions

## Difference Between Linked Service and Dataset
- Linked Service = Connection
- Dataset = Data structure/path

---

## Why Use Tumbling Window?
Supports:
- Incremental loads
- Backfills
- Window tracking
- Dependency management

---

## Why Use SHIR?
ADF cannot directly access private/on-prem sources.

---

## Difference Between Pipeline Parameter and Variable

| Parameter | Variable |
|---|---|
| Input value | Runtime mutable value |
| Immutable | Mutable |
| Passed during execution | Changed during pipeline |

---

# Key Takeaways

- ADF is Azure’s orchestration and ingestion service.
- Copy Activity is the most used activity.
- Metadata-driven pipelines are critical in enterprise projects.
- Tumbling Window is best for incremental processing.
- SHIR enables hybrid connectivity.
- ADF integrates tightly with Databricks and ADLS.
- Managed Identity + Key Vault improve security.
- Monitoring and retry policies are essential for production pipelines.