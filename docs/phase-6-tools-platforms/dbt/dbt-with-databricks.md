---
sidebar_position: 4
---

# dbt with Databricks

dbt integrates natively with Databricks SQL Warehouses and Unity Catalog. This is one of the most common production setups in Azure data engineering.

---

## Setup

Install the adapter:

```bash
pip install dbt-databricks
```

Configure `profiles.yml` (usually at `~/.dbt/profiles.yml`):

```yaml
# ~/.dbt/profiles.yml

my_dbt_project:
  target: dev
  outputs:
    dev:
      type: databricks
      host: adb-1234567890.12.azuredatabricks.net
      http_path: /sql/1.0/warehouses/abc123def456    # SQL warehouse HTTP path
      token: "{{ env_var('DATABRICKS_TOKEN') }}"
      catalog: dev_catalog       # Unity Catalog catalog
      schema: dbt_dev            # your personal dev schema
      threads: 4

    prod:
      type: databricks
      host: adb-1234567890.12.azuredatabricks.net
      http_path: /sql/1.0/warehouses/xyz789          # production SQL warehouse
      token: "{{ env_var('DATABRICKS_TOKEN') }}"
      catalog: prod_catalog
      schema: gold
      threads: 8
```

---

## Unity Catalog — Three-Level Namespace

With Unity Catalog enabled, dbt models land in `catalog.schema.table`:

```yaml
# dbt_project.yml

models:
  my_project:
    staging:
      +schema: silver         # → dev_catalog.silver.stg_orders (dev)
      +materialized: view
    marts:
      +schema: gold           # → prod_catalog.gold.fct_orders (prod)
      +materialized: table
```

Reference cross-catalog in SQL:

```sql
-- Access a source table in a different catalog
SELECT * FROM prod_catalog.bronze.raw_orders
WHERE order_date = '{{ var("run_date") }}'
```

---

## Incremental Models on Databricks (MERGE)

Databricks supports the `merge` incremental strategy natively:

```sql
-- models/marts/fct_orders.sql

{{
    config(
        materialized='incremental',
        unique_key='order_id',
        incremental_strategy='merge',
        on_schema_change='sync_all_columns',
        file_format='delta',
        partition_by=['order_date']
    )
}}

SELECT
    order_id,
    customer_id,
    order_date,
    region,
    amount,
    status,
    current_timestamp() AS dbt_processed_at
FROM {{ ref('int_orders_enriched') }}

{% if is_incremental() %}
WHERE order_date >= (
    SELECT MAX(order_date) - INTERVAL 3 DAY
    FROM {{ this }}
)
{% endif %}
```

dbt compiles this to a `MERGE INTO` statement on Delta — exactly as you'd write by hand.

---

## Running dbt in Databricks Workflows

Instead of running dbt from a VM, run it as a step inside a Databricks Workflow:

```
Databricks Workflow: daily_gold_refresh
    Task 1: Notebook — bronze_to_silver.py  (Spark transform)
    Task 2: dbt run (depends on Task 1)
            → cluster: job cluster with dbt-databricks installed
            → command: dbt run --target prod --select marts.*
    Task 3: dbt test (depends on Task 2)
            → command: dbt test --target prod --select marts.*
    Task 4: Notebook — refresh_power_bi.py (depends on Task 3)
```

**Alternative:** Call dbt from inside an ADF pipeline using a Databricks Notebook activity that installs dbt and runs `dbt run`.

---

## Delta-Specific Config Options

```sql
{{
    config(
        file_format='delta',
        location_root='abfss://gold@mystorageaccount.dfs.core.windows.net/',
        partition_by=['region', 'order_date'],
        clustered_by=['customer_id'],     -- ZORDER equivalent in dbt
        buckets=8,
        post_hook=[
            "OPTIMIZE {{ this }} ZORDER BY (customer_id)",
            "ANALYZE TABLE {{ this }} COMPUTE STATISTICS"
        ]
    )
}}
```

---

## dbt + Databricks vs dbt + Snowflake

| | dbt + Databricks | dbt + Snowflake |
|--|-----------------|-----------------|
| Storage format | Delta (open) | Snowflake proprietary |
| Incremental strategy | `merge` via Delta MERGE | `merge`, `delete+insert` |
| Performance | Photon-accelerated | Virtual warehouse auto-suspend |
| Governance | Unity Catalog | Snowflake RBAC |
| Compute billing | DBU while running | Credits while running |
| Best for | Azure-native Lakehouse | Multi-cloud, analyst-heavy teams |

---

## CI/CD with dbt

In a GitHub Actions workflow:

```yaml
# .github/workflows/dbt_ci.yml

name: dbt CI

on:
  pull_request:
    paths:
      - 'dbt/**'

jobs:
  dbt_check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dbt
        run: pip install dbt-databricks

      - name: dbt compile (syntax check)
        run: dbt compile --target dev
        env:
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}

      - name: dbt run (staging only — fast)
        run: dbt run --target dev --select staging.*

      - name: dbt test
        run: dbt test --target dev --select staging.*
```

On merge to main → separate workflow runs `dbt run --target prod --select state:modified+`.
