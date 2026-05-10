---
sidebar_position: 1
---

# Databricks Workspace Overview

Databricks is a unified analytics platform built on Apache Spark. It's the primary tool in most enterprise Azure data engineering stacks.

---

## Key Components

| Component | Purpose |
|-----------|---------|
| **Notebooks** | Interactive Spark development in Python, SQL, Scala, R |
| **Clusters** | Spark compute — all-purpose (dev) or job clusters (prod) |
| **Jobs / Workflows** | Schedule and orchestrate notebooks and scripts |
| **SQL Warehouse** | Serverless SQL compute for BI tools (Power BI, Tableau) |
| **Delta Live Tables** | Declarative streaming + batch pipeline framework |
| **Unity Catalog** | Centralized governance — catalogs, schemas, access control |
| **MLflow** | Experiment tracking and model registry |
| **Repos** | Git integration for notebooks and files |
| **DBFS** | Databricks File System (legacy — use Unity Catalog External Locations in new projects) |

---

## Cluster Types

### All-Purpose Cluster (Dev)

- Long-running, always on
- Used for interactive notebook development and exploration
- Shared by multiple users
- **Cost:** Runs even when idle — auto-terminate after 30–60 min of inactivity

```
Use for: development, ad-hoc queries, debugging
```

### Job Cluster (Prod)

- Starts when a job runs, terminates when done
- Not shared — dedicated to one job
- **Cost:** Much cheaper — pay only for job runtime

```
Use for: all production pipelines
```

### SQL Warehouse

- Optimized for SQL queries from BI tools
- Auto-scales based on query load
- Supports DirectQuery from Power BI

```
Use for: Power BI, Tableau, Databricks SQL Editor
```

---

## Notebook Best Practices

```python
# Cell 1 — Imports and widget setup
from pyspark.sql.functions import col, to_date, lit
from datetime import date

dbutils.widgets.text("run_date", str(date.today()))
run_date = dbutils.widgets.get("run_date")
```

```python
# Cell 2 — Configuration (no hardcoded values)
catalog = "prod_catalog"
schema = "silver"
source_path = f"abfss://bronze@{storage_account}.dfs.core.windows.net/orders/"
```

```python
# Cell 3 — Read
df = spark.read.format("delta").load(source_path) \
    .filter(col("_ingest_date") == run_date)
```

```python
# Cell 4 — Transform
df_clean = df.dropDuplicates(["order_id"]) \
    .filter(col("order_id").isNotNull())
```

```python
# Cell 5 — Write
df_clean.write.format("delta").mode("append").saveAsTable(f"{catalog}.{schema}.orders")
print(f"Wrote {df_clean.count()} rows to {catalog}.{schema}.orders")
```

Keep notebooks focused — one notebook per pipeline step.

---

## dbutils Reference

```python
# File system
dbutils.fs.ls("/mnt/bronze/")                    # list files
dbutils.fs.cp("src_path", "dest_path")           # copy
dbutils.fs.rm("path", recurse=True)              # delete

# Secrets
secret = dbutils.secrets.get("scope-name", "key-name")

# Widgets (parameters from ADF or Databricks Workflows)
dbutils.widgets.text("param_name", "default_value")
value = dbutils.widgets.get("param_name")

# Notebook execution
result = dbutils.notebook.run("./other_notebook", timeout_seconds=600, arguments={"key": "value"})
dbutils.notebook.exit("done")
```

---

## Repos (Git Integration)

```
Settings → Git Integration → Connect to GitHub/Azure DevOps
```

Best practices:
- One repo per domain (e.g., `sales_pipeline`, `finance_pipeline`)
- Use branches — feature branches for development, main for production
- Never edit notebooks directly in production — use CI/CD
