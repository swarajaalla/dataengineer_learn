---
sidebar_position: 2
---

# dbt Models & Materializations

A dbt model is a single `.sql` file containing a SELECT statement. dbt materializes it as a table, view, or incremental table in your warehouse.

---

## Your First Model

Create `models/staging/stg_orders.sql`:

```sql
-- models/staging/stg_orders.sql
-- Rename and lightly clean raw orders from the source table

SELECT
    order_id,
    customer_id,
    CAST(order_ts AS TIMESTAMP)     AS order_at,
    DATE(order_ts)                  AS order_date,
    CAST(amount AS DECIMAL(18, 2))  AS amount,
    UPPER(TRIM(status))             AS status,
    _ingest_ts
FROM {{ source('bronze', 'raw_orders') }}
WHERE order_id IS NOT NULL
```

Run it:

```bash
dbt run --select stg_orders
# → executes the SELECT and creates silver.stg_orders as a VIEW (default)
```

---

## Referencing Other Models

Use `{{ ref('model_name') }}` to reference another dbt model. dbt builds the DAG automatically from these references.

```sql
-- models/intermediate/int_orders_enriched.sql

SELECT
    o.order_id,
    o.order_date,
    o.amount,
    o.status,
    c.customer_name,
    c.region,
    c.tier
FROM {{ ref('stg_orders') }} o
LEFT JOIN {{ ref('stg_customers') }} c ON o.customer_id = c.customer_id
```

dbt knows `int_orders_enriched` depends on `stg_orders` and `stg_customers` — it always runs them first.

---

## Materializations

Control how each model is written to the warehouse in `dbt_project.yml` or per-model config:

```yaml
# dbt_project.yml — set defaults per folder
models:
  my_project:
    staging:
      +materialized: view       # staging = views (fast, no storage cost)
    intermediate:
      +materialized: view
    marts:
      +materialized: table      # marts = tables (BI queries, must be fast)
```

| Materialization | What it creates | When to use |
|-----------------|-----------------|-------------|
| `view` | SQL view | Staging models, light transforms |
| `table` | Full table rebuild on every `dbt run` | Small-medium marts |
| `incremental` | Only process new/changed rows | Large tables (millions of rows) |
| `ephemeral` | CTE in memory, not written to DB | Intermediate logic you don't need to query |

---

## Incremental Models

For large tables, rebuilding everything on every run is too slow. Incremental models only process new rows:

```sql
-- models/marts/fct_orders.sql

{{
    config(
        materialized='incremental',
        unique_key='order_id',
        incremental_strategy='merge'   -- or 'delete+insert', 'append'
    )
}}

SELECT
    order_id,
    customer_id,
    order_date,
    amount,
    status,
    current_timestamp() AS dbt_updated_at
FROM {{ ref('int_orders_enriched') }}

{% if is_incremental() %}
    -- on incremental runs: only process rows updated in the last 3 days
    WHERE order_date >= (SELECT MAX(order_date) - INTERVAL 3 DAY FROM {{ this }})
{% endif %}
```

On first run: full load.  
On subsequent runs: only rows matching the `WHERE` clause are processed, then MERGEd by `order_id`.

---

## Jinja Templating

dbt uses Jinja2 for dynamic SQL — variables, conditionals, loops:

```sql
-- Dynamic date filter using a variable
SELECT *
FROM {{ ref('stg_orders') }}
WHERE order_date >= '{{ var("start_date", "2024-01-01") }}'

-- Run with: dbt run --vars '{"start_date": "2024-06-01"}'
```

```sql
-- Environment-aware logic
{% if target.name == 'prod' %}
    WHERE order_date >= CURRENT_DATE - INTERVAL 90 DAY
{% else %}
    WHERE order_date >= CURRENT_DATE - INTERVAL 7 DAY   -- dev: smaller dataset
{% endif %}
```

---

## Staging → Intermediate → Marts Pattern

```
models/
├── staging/
│   ├── stg_orders.sql         ← rename, cast, filter nulls
│   ├── stg_customers.sql
│   └── stg_products.sql
│
├── intermediate/
│   ├── int_orders_enriched.sql   ← join orders + customers
│   └── int_customer_metrics.sql  ← aggregate customer-level stats
│
└── marts/
    ├── fct_orders.sql            ← fact table (incremental)
    ├── dim_customer.sql          ← dimension table (SCD1)
    └── wide_orders.sql           ← denormalized for BI
```

**Rule:** Staging models are 1-to-1 with source tables. Marts are shaped for business use cases. Intermediate is everything in between.
