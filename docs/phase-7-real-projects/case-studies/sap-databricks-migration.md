---
sidebar_position: 1
---

# Case Study 1: SAP to Databricks Unity Catalog Migration

End-to-end migration of enterprise data pipelines from a legacy Hive Metastore-based system to a modern Databricks lakehouse with Unity Catalog.

---

## Problem

### Context

An enterprise manufacturing company had been running Databricks for 2 years, but their implementation predated Unity Catalog. All tables were in the legacy Hive Metastore with:

- No centralized governance
- Workspace-level access control only
- No data lineage visibility
- Pipelines that directly mounted ADLS with storage keys in notebooks
- Data quality issues from ad-hoc ingestion pipelines built by multiple teams

### Key Pain Points

1. **Fragmented governance** — 3 Databricks workspaces, each with their own metastore. Analysts couldn't access tables across workspaces.
2. **Security gaps** — ADLS storage keys hardcoded in notebooks committed to Git
3. **No lineage** — impossible to answer "where does this Gold table's data come from?"
4. **Manual onboarding** — each new source system required a custom ADF pipeline (no reuse)
5. **Limited visibility** — pipeline failures went undetected for hours

---

## Architecture

### Before

```
SAP (on-prem)
    ↓ Custom ADF pipeline per table
ADLS Gen2 (mounted with storage keys)
    ↓ Hive Metastore tables
Databricks Workspace A / B / C (no sharing)
    ↓
Power BI (DirectQuery on Databricks SQL Endpoint)
```

### After

```
SAP (on-prem) + APIs + CSV
    ↓ Parameterized ADF ingestion framework (one pipeline for all sources)
ADLS Gen2 Bronze (External Location, Managed Identity)
    ↓ Databricks Notebooks (PySpark)
Unity Catalog — Silver (Delta)
    ↓ dbt models
Unity Catalog — Gold (Delta, star schema)
    ↓ Unity Catalog access control (RBAC)
Power BI (DirectQuery via Databricks SQL Warehouse)
```

---

## Approach

### Phase 1: Unity Catalog Setup (Week 1–2)

1. Enable Unity Catalog on the Databricks account
2. Create storage credentials using Azure Managed Identity (no more storage keys)
3. Create External Locations for Bronze, Silver, Gold containers
4. Define catalog hierarchy: `prod_catalog.{bronze/silver/gold}.{table}`
5. Migrate service principals to Managed Identity

### Phase 2: Schema Recreation (Week 2–3)

We couldn't use automated migration tools for curated (Silver/Gold) tables — the schema had drifted from the source.

```sql
-- Recreate schema in Unity Catalog
CREATE SCHEMA IF NOT EXISTS prod_catalog.silver;

-- Attach existing Delta files as external tables (no data copy needed)
CREATE TABLE prod_catalog.silver.orders
USING DELTA
LOCATION 'abfss://silver@mystorageaccount.dfs.core.windows.net/orders/';
```

This approach avoided a full reload — the existing Delta files were simply registered in Unity Catalog.

### Phase 3: ADF Framework (Week 3–5)

Replaced 30 individual ADF pipelines with one parameterized framework:

```json
Pipeline: generic_sap_ingestion
Parameters:
  - source_table_name   (e.g., "VBAK")
  - target_schema       (e.g., "bronze")
  - watermark_column    (e.g., "AEDAT")
  - load_type           (full / incremental)

Activities:
  1. Lookup: get last watermark from monitoring.pipeline_watermarks
  2. Copy: SAP → ADLS Bronze (via SHIR)
  3. Databricks: run transform_notebook with parameters
  4. Stored Procedure: update watermark on success
  5. Web (on failure): POST alert to Teams webhook
```

Run for all 30 tables via a ForEach activity reading from a configuration table.

### Phase 4: Data Validation

Before switching the Power BI reports to read from Unity Catalog tables:

```python
# Record count comparison: old vs new
old_count = spark.sql("SELECT COUNT(*) FROM legacy.orders").collect()[0][0]
new_count = spark.sql("SELECT COUNT(*) FROM prod_catalog.silver.orders").collect()[0][0]

assert abs(old_count - new_count) / old_count < 0.001, \
    f"Count mismatch: old={old_count}, new={new_count}"

# Sample data comparison
old_sample = spark.sql("SELECT * FROM legacy.orders ORDER BY order_id LIMIT 1000")
new_sample = spark.sql("SELECT * FROM prod_catalog.silver.orders ORDER BY order_id LIMIT 1000")

diff = old_sample.subtract(new_sample)
assert diff.count() == 0, f"Found {diff.count()} mismatched rows"
```

### Phase 5: Access Control Migration

```sql
-- Analyst group can only read Gold
GRANT USAGE ON CATALOG prod_catalog TO `analysts`;
GRANT USAGE ON SCHEMA prod_catalog.gold TO `analysts`;
GRANT SELECT ON ALL TABLES IN SCHEMA prod_catalog.gold TO `analysts`;

-- Engineers can read/write Silver
GRANT USAGE, CREATE ON SCHEMA prod_catalog.silver TO `data_engineers`;
GRANT SELECT, MODIFY ON ALL TABLES IN SCHEMA prod_catalog.silver TO `data_engineers`;
```

---

## Key Challenges

### 1. Hive Metastore to Unity Catalog: No Magic Button

There is no one-click migration. For each table you must decide:
- Is the Delta data at a standard path? → Create external table pointing to it
- Is the data schema correct? → DDL must be recreated from source
- Are there views on top? → Views must be recreated in Unity Catalog syntax

We created a migration script that scanned all Hive tables and generated the Unity Catalog DDL statements.

### 2. Storage Key Removal

Several notebooks had hardcoded storage keys. Resolution:
1. Moved all secrets to Azure Key Vault
2. Updated Databricks secret scopes to reference Key Vault
3. Updated notebooks to use `dbutils.secrets.get()`
4. Revoked old storage keys after validating all notebooks worked

### 3. Pipeline Reliability

Existing pipelines had no retry logic, no logging, and failed silently. The ADF framework added:
- Retry (3 attempts with exponential backoff)
- Run metadata logging to `monitoring.pipeline_runs`
- Teams webhook alerts on failure

### 4. SHIR Performance

The Self-Hosted Integration Runtime on the on-prem VM became a bottleneck for 30 concurrent SAP extracts. Resolution: added a second SHIR node and configured parallel extraction at the ADF pipeline level.

---

## Results

| Metric | Before | After |
|--------|--------|-------|
| Pipeline setup for new source | 3 days | 2 hours |
| Storage key exposure | 12 notebooks | 0 |
| Cross-workspace data access | Not possible | Self-service via Unity Catalog |
| Mean time to detect failure | 4 hours | 5 minutes |
| Manual pipeline interventions | 15/month | 2/month |
| Data lineage visibility | None | Full (Unity Catalog) |

---

## What I Learned

1. **Migration is mostly planning** — the actual data move is 20% of the work; the remaining 80% is validation, access migration, and getting stakeholder sign-off
2. **Avoid full reloads** — using external tables on existing Delta files saved weeks of reprocessing time
3. **Parameterized frameworks pay dividends** — one pipeline replacing 30 is maintained once, not 30 times
4. **Governance is not optional** — the security gaps from the old setup were a real risk, not theoretical

---

## What I'd Do Differently

- Implement the DQ framework (see [Case Study 2](./dqx-data-quality)) **before** the migration, not after
- Design the Unity Catalog hierarchy with domain teams earlier — naming conventions became a point of contention late
- Use Databricks Asset Bundles for pipeline deployment from day one (we used manual notebook deployment initially)
