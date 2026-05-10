---
sidebar_position: 1
---

# dbt — Overview

dbt (data build tool) is a SQL-first transformation framework. It lets you write SELECT statements and dbt handles the rest: materializing tables/views, running tests, generating documentation, and managing dependencies between models.

---

## What Problem dbt Solves

Before dbt, the Silver → Gold transformation layer was a mess:
- SQL scripts scattered across notebooks, stored procedures, and files
- No dependency management — manually tracking which script runs before which
- No built-in testing — data quality issues discovered by end users
- No documentation — no one knows what `dim_customer_v3_FINAL.sql` does

dbt solves all of this with structure, conventions, and a build system around SQL.

---

## How dbt Works

```
dbt project
    ├── models/               ← SQL SELECT statements (your transforms)
    │   ├── staging/          ← raw source renaming and light cleaning
    │   ├── intermediate/     ← joins and business logic
    │   └── marts/            ← final Gold-layer tables for BI
    ├── tests/                ← data quality assertions
    ├── macros/               ← reusable Jinja SQL functions
    ├── seeds/                ← small CSV files loaded as tables
    ├── sources.yml           ← declares upstream source tables
    └── dbt_project.yml       ← project config
```

**dbt command flow:**

```bash
dbt run       # compile SQL → execute on warehouse → create tables/views
dbt test      # run data quality tests on model outputs
dbt docs generate && dbt docs serve   # generate + view lineage docs
```

---

## dbt Core vs dbt Cloud

| | dbt Core | dbt Cloud |
|--|----------|-----------|
| Cost | Free, open source | Paid SaaS |
| Runs | CLI, your own scheduler | Managed jobs, IDE, scheduling |
| IDE | VS Code + CLI | Browser-based IDE |
| CI/CD | You configure | Built-in (Slim CI) |
| Orchestration | External (Airflow, ADF) | dbt Cloud jobs + webhooks |

For learning and most production setups: start with dbt Core, integrate with your existing orchestrator.

---

## Supported Data Platforms

dbt connects to the warehouse — it doesn't move data, it transforms data that's already there.

| Platform | Adapter |
|----------|---------|
| Databricks | `dbt-databricks` |
| Snowflake | `dbt-snowflake` |
| BigQuery | `dbt-bigquery` |
| Redshift | `dbt-redshift` |
| Synapse / Fabric | `dbt-synapse` / `dbt-fabric` |
| DuckDB (local) | `dbt-duckdb` |

---

## Where dbt Fits in the Stack

```
Source Systems
    ↓ ADF / Fivetran / Airbyte (ingestion — not dbt's job)
Bronze / Raw layer (ADLS / S3 / GCS)
    ↓ Spark / Glue (bronze → silver, if needed)
Silver layer in Warehouse (Databricks SQL / Snowflake / BigQuery)
    ↓ dbt (Silver → Gold transformation)
Gold layer (fact + dim tables, wide tables, aggregates)
    ↓
Power BI / Looker / Tableau
```

dbt owns the **transformation layer inside the warehouse**. It does not ingest raw data.
