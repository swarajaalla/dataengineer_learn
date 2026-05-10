---
sidebar_position: 3
---

# Design Trade-offs & Decision Framework

Every architecture decision has a cost. This page covers the real trade-offs you'll face and how to reason through them.

---

## Batch vs Streaming

The most common trade-off in data engineering.

| Factor | Batch | Streaming |
|--------|-------|-----------|
| Latency | Minutes to hours | Seconds to minutes |
| Complexity | Low | High |
| Cost | Lower (scheduled bursts) | Higher (always-on compute) |
| Fault tolerance | Easy (rerun the job) | Harder (checkpoints, exactly-once) |
| Use case | Reports, historical analysis | Real-time dashboards, alerting, CDC |

**Rule of thumb:** Start with batch. Add streaming only when latency requirement forces it. "We want real-time" often means "we want hourly," which batch handles fine.

---

## Normalization vs Denormalization

| Approach | Pros | Cons |
|----------|------|------|
| **Normalized** (star schema) | Less storage, cleaner updates, referential integrity | More joins → slower BI queries |
| **Denormalized** (wide tables) | Faster BI queries, fewer joins | Larger tables, redundant data, harder updates |

**In practice:** Normalize at Silver (fact + dimension tables). Denormalize at Gold for BI use cases where performance matters.

```sql
-- Silver (normalized): fact + dim
SELECT f.amount, d.customer_name, p.product_name
FROM fact_orders f
JOIN dim_customer d ON f.customer_key = d.customer_key
JOIN dim_product p ON f.product_key = p.product_key;

-- Gold (denormalized): pre-joined wide table for Power BI
SELECT order_date, customer_name, product_category, amount, region
FROM gold.wide_orders;
```

---

## SCD Type 1 vs SCD2

How you handle changing dimension attributes drives storage cost and historical accuracy.

| Type | Behavior | Storage | Historical Accuracy |
|------|----------|---------|---------------------|
| **SCD1** | Overwrite old value | Low | No history |
| **SCD2** | Add new row, flag old | Higher | Full history |
| **SCD3** | Add "previous" column | Medium | One version back |

**When to use SCD2:** Customer address, product price, employee department — cases where you need to know what the value WAS at the time of the transaction.

```sql
-- SCD2 pattern — new row for each change
| customer_key | customer_id | city      | is_current | valid_from | valid_to   |
|--------------|-------------|-----------|------------|------------|------------|
| 1            | 100         | London    | false      | 2022-01-01 | 2023-06-15 |
| 2            | 100         | Manchester| true       | 2023-06-15 | 9999-12-31 |
```

---

## Partitioning Decisions

Wrong partition key → slow queries and small file problems.

| Scenario | Partition Key | Reason |
|----------|--------------|--------|
| Daily batch pipeline | `order_date` | Most queries filter by date |
| Multi-tenant data | `tenant_id` + `date` | Isolate per tenant + date filter |
| Global dataset, region queries | `region` | Partition pruning on region filter |
| High-cardinality column | AVOID | Too many small files |

**Cardinality rule:** Partition columns should have 10–3000 distinct values. Don't partition by `order_id` (millions of partitions) or `country_code` if you only have 3 countries (no benefit).

**Target file size:** 128MB–1GB per file. Below 128MB you have a small file problem.

```python
# Check partition sizes after write
display(
    spark.sql("DESCRIBE DETAIL silver.orders")
    .select("numFiles", "sizeInBytes")
)
# If numFiles is too high → OPTIMIZE + ZORDER
spark.sql("OPTIMIZE silver.orders ZORDER BY (customer_id)")
```

---

## Idempotency — Design Every Pipeline to Re-run Safely

A pipeline is idempotent if running it twice produces the same result as running it once.

**Why it matters:** Pipelines fail. When they restart, you don't want duplicate data.

| Pattern | Idempotent? | How |
|---------|-------------|-----|
| `INSERT INTO` | No — duplicates | Bad |
| `MERGE INTO` | Yes | Upsert by primary key |
| `mode("overwrite")` on partition | Yes | Replaces whole partition |
| Streaming with checkpoints | Yes | Checkpoint tracks offset |

```python
# NON-idempotent — avoid
df.write.format("delta").mode("append").saveAsTable("silver.orders")

# Idempotent — prefer
df.write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", "order_date = '2024-01-15'") \
    .saveAsTable("silver.orders")

# Or MERGE
spark.sql("""
    MERGE INTO silver.orders t
    USING updates s ON t.order_id = s.order_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

---

## Push vs Pull Ingestion

| Model | Description | Use When |
|-------|-------------|----------|
| **Pull** | Pipeline queries source on schedule | Source is a DB, API, or file share |
| **Push** | Source sends events to your pipeline | Source is event-driven (IoT, clickstream) |
| **Event-driven pull** | File lands in storage → triggers pipeline | File-based sources (CSV drops, exports) |

**Event-driven pull (best of both):**

```
Source drops file to ADLS
    → Azure Storage Event → Event Grid → ADF Event Trigger
    → Pipeline runs immediately (no polling delay)
    → No missed files (event guarantees delivery)
```

---

## Centralized vs Federated Architecture

| Approach | Pros | Cons |
|----------|------|------|
| **Centralized** | Single governance, easy to query across domains | Central team bottleneck, slow to move |
| **Federated (Data Mesh)** | Domain teams own their data, scales org-wide | Harder to enforce standards, duplicated effort |

**In practice at most companies:** Centralized lakehouse (ADLS + Databricks) with domain-specific schemas in Unity Catalog. Full data mesh is uncommon outside large enterprises.

---

## Summary: Questions to Ask Before Designing

1. **What is the latency requirement?** → Batch / micro-batch / streaming
2. **How large is the data?** → Partitioning strategy, cluster sizing
3. **Does the source support incremental extraction?** → Watermark vs full load vs CDC
4. **Do we need historical accuracy on dimension changes?** → SCD1 vs SCD2
5. **Who consumes the data and how?** → Wide table vs star schema, Delta vs BI-native format
6. **What happens if the pipeline fails mid-run?** → Idempotency, checkpoints, DLQ
7. **Who owns data quality?** → Define DQ rules and ownership before building
