---
sidebar_position: 3
---

# dbt Testing & Documentation

dbt has built-in testing and auto-generated documentation. These are two of its biggest advantages over raw SQL scripts.

---

## Tests — Data Quality Built In

dbt tests run after `dbt run` and validate your model outputs. Tests fail if the assertion is false — the pipeline breaks before bad data reaches BI.

### Generic Tests (schema.yml)

Define tests in a YAML file next to your models:

```yaml
# models/staging/schema.yml

version: 2

models:
  - name: stg_orders
    description: "Cleaned and typed orders from the bronze raw table"
    columns:
      - name: order_id
        description: "Primary key for orders"
        tests:
          - not_null          # fails if any order_id is NULL
          - unique            # fails if any order_id appears more than once

      - name: status
        tests:
          - not_null
          - accepted_values:
              values: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

      - name: customer_id
        tests:
          - not_null
          - relationships:    # referential integrity check
              to: ref('stg_customers')
              field: customer_id

      - name: amount
        tests:
          - not_null
```

Run tests:

```bash
dbt test                          # run all tests
dbt test --select stg_orders      # run tests for one model
dbt test --select tag:critical    # run tests tagged as critical
```

### Singular Tests (custom SQL)

For business rules that generic tests can't express:

```sql
-- tests/assert_no_negative_amounts.sql
-- This test PASSES if zero rows are returned

SELECT *
FROM {{ ref('stg_orders') }}
WHERE amount < 0
```

```sql
-- tests/assert_revenue_matches_source.sql
-- Total revenue in dbt model must match source within 0.1%

WITH dbt_total AS (
    SELECT SUM(amount) AS revenue FROM {{ ref('fct_orders') }}
),
source_total AS (
    SELECT SUM(amount) AS revenue FROM {{ source('bronze', 'raw_orders') }}
)
SELECT *
FROM dbt_total, source_total
WHERE ABS(dbt_total.revenue - source_total.revenue) / source_total.revenue > 0.001
```

---

## dbt-expectations (Advanced Tests)

The `dbt-expectations` package adds Great Expectations-style tests:

```yaml
columns:
  - name: amount
    tests:
      - dbt_expectations.expect_column_values_to_be_between:
          min_value: 0
          max_value: 100000
      - dbt_expectations.expect_column_mean_to_be_between:
          min_value: 50
          max_value: 500

  - name: order_date
    tests:
      - dbt_expectations.expect_column_values_to_be_of_type:
          column_type: date
```

---

## Severity Levels

Not every test failure should block the pipeline:

```yaml
- name: amount
  tests:
    - not_null:
        severity: error    # pipeline fails (default)
    - dbt_expectations.expect_column_mean_to_be_between:
        min_value: 40
        max_value: 600
        severity: warn     # logs warning, pipeline continues
        config:
          warn_if: ">= 10"   # warn if 10+ rows fail
          error_if: ">= 100" # error if 100+ rows fail
```

---

## Documentation

dbt generates a full data catalog from your YAML descriptions and model code:

```yaml
# models/marts/schema.yml

models:
  - name: fct_orders
    description: >
      Fact table for all completed orders. One row per order.
      Incremental — updated daily. Source: stg_orders + dim_customer.
    columns:
      - name: order_id
        description: "Surrogate key — unique per order"
      - name: amount
        description: "Order value in GBP, excluding VAT"
      - name: order_date
        description: "Date of order placement (UTC)"
```

Generate and serve docs:

```bash
dbt docs generate    # compile docs from YAML + SQL
dbt docs serve       # open browser at localhost:8080
```

The docs site shows:
- **Lineage graph** — visual DAG of all models and their dependencies
- **Column descriptions** — from your YAML
- **Compiled SQL** — the actual query that ran in your warehouse
- **Test results** — which tests pass/fail per model

---

## Sources — Declaring Upstream Tables

Tell dbt where raw data comes from so it can track lineage back to the source:

```yaml
# models/staging/sources.yml

version: 2

sources:
  - name: bronze
    description: "Raw ingested data from ADF"
    database: my_catalog
    schema: bronze
    tables:
      - name: raw_orders
        description: "Raw orders from SQL Server via ADF Copy Activity"
        freshness:
          warn_after: {count: 12, period: hour}
          error_after: {count: 25, period: hour}
        loaded_at_field: _ingest_ts   # column dbt checks for freshness

      - name: raw_customers
        description: "CRM customer data"
```

Check source freshness:

```bash
dbt source freshness
# → warns or errors if _ingest_ts is older than the threshold
```

This shows up in the lineage graph: Source (raw_orders) → stg_orders → int_orders_enriched → fct_orders.
