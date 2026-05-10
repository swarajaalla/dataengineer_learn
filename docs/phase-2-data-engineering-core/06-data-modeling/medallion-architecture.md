---
sidebar_position: 6
---

# Medallion Architecture

Medallion architecture organizes your data lake into three quality layers: Bronze (raw), Silver (clean), and Gold (serving). It's the standard architecture for Databricks-based data platforms.

---

## What It Is

```
Bronze  →  Silver  →  Gold
 (raw)    (clean)   (serving)
```

Each layer has a specific purpose, format, and ownership. Data only flows in one direction: Bronze → Silver → Gold.

---

## Bronze Layer: Raw, Immutable, As-Is

The landing zone. Data arrives here exactly as it came from the source — no transformation.

**Rules:**
- Never modify or delete Bronze data
- Preserve source format (CSV, JSON, Parquet) where possible
- Add metadata: `ingestion_timestamp`, `source_system`, `source_file_name`
- Append-only — new data adds rows, never updates

**What lands in Bronze:**
```
/bronze/sap/sales_orders/year=2024/month=01/day=15/
  → Part-files from ADF Copy Activity, CSV or Parquet format, as-is from SAP

/bronze/salesforce/contacts/2024-01-15_09:00:00/
  → JSONL files from REST API pull

/bronze/kafka/order_events/year=2024/month=01/day=15/hour=09/
  → Avro files from Event Hub streaming consumer
```

**Why:** If Silver processing was wrong, you replay from Bronze. If you modified Bronze, that's not possible.

---

## Silver Layer: Clean, Validated, Typed

Transformed raw data into trusted, queryable data. All business rules applied.

**What happens in the Bronze → Silver job:**
1. Cast types correctly (string → date, string → decimal)
2. Handle nulls (fill defaults, flag, quarantine bad records)
3. Remove duplicates
4. Standardize formats (uppercase names, ISO date formats)
5. Flatten nested structures (JSON → relational columns)
6. Validate against rules (reject rows with null primary keys)
7. Add audit columns (`processed_timestamp`, `source_system`)

**Format:** Always Delta. Schema enforced. Updated via MERGE.

```
/silver/sap_sales_orders/
  → Delta format, partitioned by order_date
  → Schema: order_id (BIGINT), customer_code (STRING), order_date (DATE), revenue (DECIMAL), ...
  → History preserved (time travel available)
```

**Ownership:** Data engineering team. Silver is the authoritative, clean source of truth.

---

## Gold Layer: Aggregated, Business-Ready, Serving

Star schema tables, aggregated datasets, and wide tables optimized for BI tools and ML.

**What gets built in Silver → Gold:**
1. Dimension tables (SCD Type 2 — customer, product, store)
2. Fact tables (joined, measure-enriched)
3. Aggregated tables (daily revenue by product category)
4. Wide tables for specific use cases (one big table for a single dashboard)

**Format:** Delta. Optimized with `OPTIMIZE` and Z-ORDER.

```
/gold/
  dim_customer/    → SCD2 customer dimension
  dim_product/     → product hierarchy
  dim_date/        → date dimension
  fact_orders/     → grain: one line item, partitioned by date
  agg_daily_revenue/  → pre-aggregated for fast dashboard queries
```

**Ownership:** Business stakeholders, data product teams. Gold tables have documented owners and SLAs.

---

## Why Medallion Works

**Separation of concerns:** Each layer has one job. Bronze is for ingestion. Silver is for quality. Gold is for serving.

**Replay from raw:** If Silver logic was wrong (wrong dedup key, wrong type), re-run from Bronze in minutes. No re-ingestion.

**Audit trail:** Bronze = complete, immutable history. You can always prove what the source sent.

**Independent compute:** Bronze jobs are I/O-heavy (copy). Silver jobs are CPU-heavy (transform). Gold jobs are logic-heavy (model). Each can be sized independently.

---

## Naming Conventions

**Databases / Schemas:**
```
catalog.bronze   (or bronze_sap, bronze_salesforce if multi-source)
catalog.silver
catalog.gold
```

**Tables:**
```
bronze.sap_sales_orders        -- source system + entity
silver.sap_sales_orders        -- same name, different database = different quality
gold.fact_orders               -- fact_ prefix for fact tables
gold.dim_customer              -- dim_ prefix for dimensions
gold.agg_daily_revenue         -- agg_ prefix for aggregations
```

---

## Unity Catalog Integration

In Databricks with Unity Catalog:

```sql
-- Three-level namespace: catalog.schema.table
CREATE CATALOG IF NOT EXISTS dev;
USE CATALOG dev;

CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- Tables are registered in Unity Catalog with metadata
CREATE TABLE silver.sap_sales_orders (
    order_id BIGINT,
    ...
) USING DELTA
COMMENT 'Cleaned SAP sales orders. Grain: one order line item. Owner: DE team.'
TBLPROPERTIES ('layer' = 'silver', 'source' = 'SAP ECC', 'team' = 'data-engineering');
```

Unity Catalog automatically tracks lineage: which notebook wrote to which table, which table reads from which source.

---

## Common Mistakes

**Mistake: Skipping Silver and going Bronze → Gold**
```
Risk: Business logic is applied directly on raw data
Problem: Gold tables are brittle — any source change breaks them
Fix: Always have a clean intermediate Silver layer
```

**Mistake: Putting transformations in the ingestion (Bronze) layer**
```
Risk: Bronze is no longer raw
Problem: Can't replay Bronze without re-ingesting from source
Fix: Bronze = copy as-is. All transforms happen Bronze → Silver
```

**Mistake: Using Silver as the final serving layer for BI**
```
Risk: Silver tables may have complex joins, no aggregations
Problem: Power BI queries are slow, schema is confusing for analysts
Fix: Build Gold star schema tables specifically for reporting
```
