---
sidebar_position: 3
---

# Lakehouse

A lakehouse combines the cheap storage of a data lake with the reliability and performance features of a data warehouse. One platform for all analytics and ML workloads.

---

## The Problem It Solves

The traditional architecture had two separate systems:

```
Data Lake (raw, cheap)          Data Warehouse (clean, expensive)
     ↓                                   ↑
     └──────── ETL pipeline ─────────────┘
                  ↑
         Expensive duplication:
         - Same data stored twice
         - Sync issues when lake and warehouse diverge
         - Two teams, two tools, two maintenance burdens
```

The lakehouse eliminates this by adding warehouse features directly on top of the lake.

---

## What the Lakehouse Adds to a Lake

| Feature | Plain Lake (Parquet) | Lakehouse (Delta Lake) |
|---------|---------------------|----------------------|
| **ACID transactions** | No | Yes |
| **Schema enforcement** | No | Yes |
| **Schema evolution** | Manual | Supported |
| **Time travel** | No | Yes (30 days default) |
| **DML operations** | No (can't UPDATE/DELETE Parquet) | Yes (MERGE, UPDATE, DELETE) |
| **Query performance** | OK | Optimized (Z-order, file statistics) |
| **Streaming + batch** | Separate tools | Unified |

---

## Delta Lake: The Open Format Enabling Lakehouse

Delta Lake is an open-source storage format built on Parquet. It adds a `_delta_log/` transaction log.

```
/silver/customers/
  ├── _delta_log/
  │   ├── 00000000000000000000.json   ← initial commit
  │   ├── 00000000000000000001.json   ← second commit
  │   └── 00000000000000000010.checkpoint.parquet
  ├── part-00000-abc123.snappy.parquet
  ├── part-00001-def456.snappy.parquet
  └── part-00002-ghi789.snappy.parquet
```

The log records which Parquet files are part of the current table state. This enables ACID, time travel, and concurrent reads/writes.

---

## Databricks Lakehouse Architecture

```
Unity Catalog (governance layer)
  ├── Catalog: dev / prod / sandbox
  │   └── Schema (database): bronze / silver / gold
  │       └── Tables (Delta): fact_sales, dim_customer, ...
  
Databricks Workspace
  ├── Notebooks (data processing logic)
  ├── Workflows (orchestration)
  ├── SQL Warehouse (BI queries)
  └── ML Runtime (model training on same Delta data)
  
ADLS Gen2 (physical storage — cheap object storage)
  └── Delta files (Parquet + _delta_log/)
```

One storage layer (ADLS), one governance layer (Unity Catalog), multiple compute patterns (SQL, Spark, ML).

---

## Unity Catalog: Governance on the Lakehouse

Unity Catalog gives you:
- **Centralized permissions** — one place to control who can read which table
- **Data lineage** — automatically tracks which notebook read from which table and wrote to which table
- **Column-level security** — mask PII columns for non-privileged users
- **Audit logs** — who accessed what, when

Without Unity Catalog, permissions are per-workspace and there's no lineage. In a multi-workspace enterprise setup, this becomes unmanageable.

---

## Traditional 2-Tier vs Lakehouse

**2-Tier (Lake + Warehouse):**
```
ADLS (raw)
  → Databricks ETL → Synapse / Snowflake (modeled)
  → BI team uses warehouse
  → ML team uses lake
  → Two copies of data, two governance systems, sync problems
```

**Lakehouse:**
```
ADLS (Delta Bronze/Silver/Gold)
  → BI team uses Databricks SQL on Gold tables
  → ML team uses Databricks notebooks on Silver tables
  → One copy, one governance layer, no sync needed
```

---

## When Lakehouse is Overkill

- **Small company, simple BI:** Snowflake + Fivetran is simpler and faster to set up
- **SQL-only team:** No ML, no semi-structured data — a warehouse is sufficient
- **Budget-constrained small team:** Databricks has a learning curve and licensing cost

If you're just loading CSVs and building Power BI dashboards on 50 GB of data, a lakehouse adds unnecessary complexity.
