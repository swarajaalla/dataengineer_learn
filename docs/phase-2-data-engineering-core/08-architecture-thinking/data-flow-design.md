---
sidebar_position: 4
---

# Data Flow Design

Data flow design is about knowing where data comes from, where it goes, who depends on it, and what happens when something changes. Without this, pipelines are black boxes.

---

## Designing a Data Flow

Before building, map the flow:

```
Source → Ingestion → Landing → Processing → Serving → Consumer
```

For each step, document:
- **What data moves** (table, API, file)
- **How often** (daily, hourly, event-driven)
- **Format** (CSV, JSON, Delta)
- **Owner** (who is responsible for each step)
- **SLA** (when must it be complete by)
- **Failure contact** (who gets paged)

---

## Data Lineage

Lineage tracks the origin and transformation history of every piece of data.

"Where did this revenue number come from?"
- Gold: `fact_orders.revenue` = `quantity × unit_price - discount`
- Silver: `sap_orders.quantity`, `sap_orders.unit_price`, `sap_orders.discount_amount`
- Bronze: raw SAP extract, field `NETWR` mapped to `unit_price`
- Source: SAP table `VBRP`, field `NETWR`

**Without lineage:** When a number is wrong, debugging takes days.
**With lineage:** You trace the bug to the source in 10 minutes.

**Unity Catalog automatic lineage:**
```python
# Unity Catalog tracks this automatically when you use Databricks notebooks
df = spark.table("bronze.sap_orders")          # read from bronze
df_clean = df.filter(...).withColumn(...)      # transform
df_clean.write.saveAsTable("silver.orders")    # write to silver

# Unity Catalog records: silver.orders was created from bronze.sap_orders
# In the Unity Catalog UI: Data Lineage → silver.orders → upstream tables
```

---

## Data Contracts

A data contract is a formal agreement between a data producer and data consumer about schema, format, semantics, and SLAs.

**Why it matters:** Without contracts, a source team can change a field name and silently break 10 downstream pipelines.

**What a data contract covers:**

```yaml
# Example data contract
contract_id: "sap-sales-orders-v2"
producer: "SAP team"
consumer: ["DE team - Bronze ingestion"]
effective_date: "2024-01-01"

schema:
  - field: "VBELN"    # order number
    type: "STRING(10)"
    nullable: false
  - field: "POSNR"    # line item
    type: "STRING(6)"
    nullable: false
  - field: "NETWR"    # net value (revenue)
    type: "DECIMAL(15,2)"
    nullable: true

sla:
  availability: "daily export complete by 01:00 UTC"
  latency: "< 2 hours from period close"
  
change_process:
  notice_period: "30 days for breaking changes"
  notification: "data-platform-alerts@company.com"
```

---

## Schema Evolution: Handling Source Changes

Source systems change schema without warning. Your pipeline must handle this gracefully.

**Common schema changes:**
- New column added (usually safe)
- Column renamed (breaking — your code references the old name)
- Column type changed (breaking — string to int may fail casting)
- Column removed (breaking — downstream code fails)

**Delta + mergeSchema for non-breaking additions:**
```python
# Bronze: accept new columns from source automatically
df.write.format("delta") \
    .option("mergeSchema", "true") \  # allow adding new columns
    .mode("append") \
    .save("/bronze/sap_orders/")

# Silver: detect the new column in validation, alert before propagating
new_cols = set(df.columns) - set(expected_columns)
if new_cols:
    send_alert(f"New columns detected in SAP export: {new_cols}. Review before Silver processing.")
```

**Schema validation at Bronze:**
```python
expected_schema = ["VBELN", "POSNR", "NETWR", "WAERK", "VKORG"]

def validate_schema(df, expected_cols, source_name):
    missing = set(expected_cols) - set(df.columns)
    extra = set(df.columns) - set(expected_cols)
    
    if missing:
        raise SchemaError(f"{source_name}: Missing required columns: {missing}")
    if extra:
        logger.warning(f"{source_name}: Unexpected new columns: {extra}")
```

---

## Push vs Pull Data Flows

**Pull:** Your pipeline queries the source on a schedule.
```
ADF scheduler → queries SQL Server → extracts delta → writes to ADLS
```
- You control the timing
- Source must be queryable during your window
- More common in batch

**Push:** The source sends data to your platform when it's ready.
```
SAP job completes → deposits file on SFTP → ADF event trigger fires → ingests
```
- Lower latency (ingestion starts immediately when source is ready)
- Source must support push/webhook
- More resilient to source timing variations

**Event-driven (push via message broker):**
```
Application → Kafka event → Databricks Structured Streaming → Delta
```
- Lowest latency
- Source decoupled from consumer
- Requires message broker infrastructure

---

## Fan-In and Fan-Out

**Fan-in:** Multiple sources → one landing zone or target

```
SAP Sales Orders  ──┐
SAP Billing Data  ──┤──► ADF (parameterized ForEach) ──► ADLS Bronze/sap/
SAP Master Data   ──┘
```

**Fan-out:** One source → multiple consumers

```
ADLS Bronze/sap/orders/ ──┬──► Databricks Silver job (daily)
                           ├──► Data science team (ad-hoc exploration)
                           └──► Compliance team (audit log queries)
```

With Unity Catalog, fan-out is managed through permissions: each consumer group gets read access to the tables they need — nothing else.

---

## Documenting Data Flows

Minimum documentation for any production pipeline:

```
Pipeline: sap_orders_to_gold

Source: SAP ECC, table VBRP (billing items)
Frequency: Daily at 01:00 UTC
Volume: ~500K rows/day
Bronze: abfss://bronze@account.dfs.core.windows.net/sap/vbrp/
Silver: catalog.silver.sap_billing_items (Delta)
Gold: catalog.gold.fact_orders (Delta, grain: one billing line item)

Owner: Data Engineering team (data-engineering@company.com)
SLA: Gold table ready by 05:00 UTC
On-call: DE on-call rotation (PagerDuty)

Dependencies:
  - Upstream: SAP ECC export job (runs 00:00 UTC)
  - Downstream: Power BI revenue dashboard, ML churn model
  
Schema contract: v2.3 (signed 2024-01-01 with SAP team)
```
