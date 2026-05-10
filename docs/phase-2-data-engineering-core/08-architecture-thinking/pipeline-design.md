---
sidebar_position: 3
---

# Pipeline Design Principles

A well-designed pipeline is reliable, re-runnable, and maintainable. A poorly designed pipeline creates data debt that compounds over time.

---

## Principle 1: Idempotency

Running the same pipeline twice produces the same result. No duplicates, no data loss.

**Why it matters:** Pipelines fail. They get re-run. If re-running creates duplicates, every failure requires manual cleanup — which doesn't scale.

```python
# NOT idempotent — appends on every run
df.write.mode("append").format("delta").save("/silver/orders/")

# Idempotent — MERGE handles duplicates
silver.alias("tgt").merge(
    source.alias("src"),
    "tgt.order_id = src.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# Also idempotent — partition overwrite replaces exactly the date's partition
df.write.mode("overwrite") \
    .option("replaceWhere", f"order_date = '{process_date}'") \
    .format("delta").save("/silver/orders/")
```

---

## Principle 2: Separation of Concerns

One pipeline does one thing. Ingestion doesn't transform. Transformation doesn't serve.

```
ADF Pipeline: sap_orders_ingest
  → Copies SAP data to ADLS Bronze
  → No transformation, no joins, no business logic

Databricks Job: sap_orders_silver
  → Reads Bronze, cleans, validates, writes Silver
  → No ingestion, no Gold logic

Databricks Job: fact_orders_gold
  → Reads Silver, builds star schema, writes Gold
  → No Bronze access, no ingestion
```

**Why:** When Silver logic changes, you re-run from Bronze without touching ingestion. When Gold logic changes, you re-run from Silver without touching Bronze or Silver.

---

## Principle 3: Configuration-Driven Design

Move what changes (source query, target path, watermark column) out of code into a configuration table. Code stays the same; configuration drives behavior.

```sql
-- Pipeline configuration table
CREATE TABLE pipeline_config (
    pipeline_name       VARCHAR(100) PRIMARY KEY,
    source_type         VARCHAR(50),    -- 'sql', 'rest_api', 'sftp', 'adls'
    source_connection   VARCHAR(500),   -- connection string or linked service name
    source_query        VARCHAR(MAX),   -- parameterized SQL or API path
    target_container    VARCHAR(100),
    target_path         VARCHAR(500),
    watermark_column    VARCHAR(100),
    partition_column    VARCHAR(100),
    schedule_cron       VARCHAR(100),
    is_active           BIT DEFAULT 1
);
```

One ADF pipeline template handles 50+ tables. Change ingestion behavior by updating a config row, not by modifying pipeline code.

---

## Principle 4: Fail Fast and Loudly

Detect problems early. Don't let bad data silently propagate to Gold.

```python
# Fail fast: validate immediately after reading Bronze
def validate_bronze(df, source_name):
    null_pct = df.filter(col("order_id").isNull()).count() / df.count()
    
    if null_pct > 0.01:  # more than 1% nulls on primary key = problem
        raise ValueError(
            f"{source_name}: {null_pct:.1%} of order_id values are null. "
            f"Aborting Silver processing."
        )
    
    record_count = df.count()
    if record_count == 0:
        raise ValueError(f"{source_name}: Empty Bronze extract. Aborting.")
    
    return df

silver_df = validate_bronze(bronze_df, "sap_sales_orders")
```

A pipeline that fails loudly creates an alert. A pipeline that silently produces wrong data creates a board meeting.

---

## Principle 5: Observability

Know what your pipeline is doing without needing to look at the code.

**Metrics to track:**
- Records read from source
- Records written to Bronze
- Records rejected in validation
- Records merged to Silver
- Pipeline start time, end time, duration
- Cluster cost per run

```python
# Log metrics to a pipeline runs table
def log_pipeline_run(pipeline_name, run_id, records_read, records_written, status, error_msg=None):
    spark.sql(f"""
        INSERT INTO pipeline_runs VALUES (
            '{pipeline_name}', '{run_id}',
            {records_read}, {records_written},
            current_timestamp(), '{status}', '{error_msg or ""}'
        )
    """)
```

---

## Real ADF Framework: Metadata-Driven Ingestion

```
Azure SQL: ingestion_config table
  → ADF: Lookup Activity reads all active configs
  → ADF: ForEach iterates each config row
     └── ADF: Lookup2 reads last watermark
     └── ADF: Copy Activity (parameterized):
              Source: @item().source_query.replace('@watermark', watermark)
              Sink: @concat(item().target_path, '/', formatDateTime(utcnow(), 'yyyy/MM/dd'))
     └── ADF: Stored Procedure updates watermark on success
     └── ADF: Web Activity posts failure to Teams on failure
```

This framework handles 50+ SAP tables, 10+ API sources, and 5+ SFTP file sources — all in one ADF pipeline template.

---

## Pipeline Testing

```python
# Unit test: transformation logic on small data
def test_deduplication():
    input_data = [
        ("ORD-001", "2024-01-15", 100.0, "2024-01-15 09:00:00"),
        ("ORD-001", "2024-01-15", 100.0, "2024-01-15 09:01:00"),  # duplicate
    ]
    df = spark.createDataFrame(input_data, ["order_id", "date", "total", "updated_at"])
    result = deduplicate(df)
    assert result.count() == 1  # should keep only one row

# Data quality test: production data
def test_silver_completeness():
    silver_count = spark.table("silver.orders") \
        .filter(col("order_date") == yesterday).count()
    bronze_count = spark.table("bronze.sap_orders") \
        .filter(col("source_date") == yesterday).count()
    
    completeness_pct = silver_count / bronze_count
    assert completeness_pct >= 0.99, f"Silver completeness: {completeness_pct:.1%}"
```
