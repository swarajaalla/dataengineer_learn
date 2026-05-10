---
sidebar_position: 4
---

# Databricks Certified Data Engineer Professional

The advanced Databricks certification. Harder than Associate — tests architectural judgment, performance tuning, and real-world production pipeline design. Worth pursuing after 1+ years of Databricks production experience.

---

## What It Covers

| Domain | Weight |
|--------|--------|
| Databricks Tooling | 20% |
| Data processing | 30% |
| Data modelling | 20% |
| Security and governance | 10% |
| Monitoring and logging | 10% |
| Testing and deployment | 10% |

**Professional goes deeper than Associate on:**
- Complex Spark performance tuning (AQE, broadcast joins, skew handling)
- Advanced Delta Lake (Change Data Feed, deletion vectors, liquid clustering)
- Delta Live Tables — expectations, event log, pipeline monitoring
- Unity Catalog — fine-grained access control, row filters, column masks
- CI/CD with Databricks Asset Bundles (DABs)
- Multi-hop architecture design decisions
- Structured Streaming — checkpoints, watermarks, triggers, exactly-once

---

## Exam Format

- Duration: 120 minutes
- Questions: 60 multiple choice
- Passing score: 70%
- Cost: $200 USD
- Prerequisite: None officially, but Associate first is strongly recommended
- Valid for: 2 years

---

## Study Resources

| Resource | Cost | Notes |
|----------|------|-------|
| Databricks Academy — Professional path | Free | Official learning path, do all labs |
| "The Definitive Guide to Delta Lake" (O'Reilly) | Free PDF | Deep Delta Lake internals |
| Udemy (advanced Databricks courses) | ~$15 | Focus on DLT + performance modules |
| GitHub — Databricks demos repo | Free | Real production patterns with code |

---

## Key Advanced Topics

### Change Data Feed (CDF) — Delta

Track row-level changes in Delta tables for CDC pipelines:

```python
# Enable CDF on a table
spark.sql("ALTER TABLE silver.orders SET TBLPROPERTIES (delta.enableChangeDataFeed = true)")

# Read changes since version 5
changes = spark.read.format("delta") \
    .option("readChangeFeed", "true") \
    .option("startingVersion", 5) \
    .table("silver.orders")

# _change_type: insert, update_preimage, update_postimage, delete
changes.filter("_change_type = 'update_postimage'").show()
```

### Liquid Clustering — Replace Partitioning

```sql
-- Liquid clustering replaces PARTITION BY — more flexible, self-tuning
CREATE TABLE silver.orders
CLUSTER BY (customer_id, order_date);

-- Cluster incrementally (no full rewrite needed)
OPTIMIZE silver.orders;
```

### Advanced Structured Streaming

```python
# Trigger options
.trigger(processingTime="5 minutes")    # micro-batch every 5 min
.trigger(once=True)                     # process all available, then stop
.trigger(availableNow=True)             # process all available, then stop (preferred)
.trigger(continuous="1 second")         # low-latency continuous mode

# Watermark + window aggregation
from pyspark.sql.functions import window

stream \
    .withWatermark("event_ts", "10 minutes") \
    .groupBy(window("event_ts", "5 minutes"), "region") \
    .agg(sum("amount").alias("revenue")) \
    .writeStream \
    .outputMode("update") \
    .foreachBatch(merge_to_delta) \
    .start()
```

### Unity Catalog — Row Filters and Column Masks

```sql
-- Column mask — hide PII from non-privileged users
CREATE FUNCTION mask_email(email STRING)
RETURNS STRING
RETURN CASE
    WHEN IS_MEMBER('pii-readers') THEN email
    ELSE CONCAT(LEFT(email, 2), '***@***.***')
END;

ALTER TABLE gold.customers
ALTER COLUMN email SET MASK mask_email;

-- Row filter — users only see their region's data
CREATE FUNCTION region_filter(region STRING)
RETURNS BOOLEAN
RETURN IS_MEMBER(CONCAT('region-', region));

ALTER TABLE gold.orders
ADD ROW FILTER region_filter ON (region);
```

### Databricks Asset Bundles (DABs) — CI/CD

```yaml
# databricks.yml — bundle definition
bundle:
  name: sales_pipeline

resources:
  jobs:
    daily_gold_refresh:
      name: daily_gold_refresh
      tasks:
        - task_key: bronze_to_silver
          notebook_task:
            notebook_path: ./notebooks/bronze_to_silver
          job_cluster_key: main_cluster
        - task_key: silver_to_gold
          depends_on:
            - task_key: bronze_to_silver
          notebook_task:
            notebook_path: ./notebooks/silver_to_gold
          job_cluster_key: main_cluster

  job_clusters:
    - job_cluster_key: main_cluster
      new_cluster:
        spark_version: 14.3.x-scala2.12
        node_type_id: Standard_DS3_v2
        num_workers: 4

targets:
  dev:
    mode: development
    workspace:
      host: https://adb-dev.azuredatabricks.net
  prod:
    mode: production
    workspace:
      host: https://adb-prod.azuredatabricks.net
```

---

## What Makes Professional Harder

- Questions require architectural reasoning, not just syntax recall
- "What is the BEST approach" — multiple answers look correct
- Performance questions need understanding of Spark internals (shuffle, AQE, broadcast)
- DLT questions focus on pipeline monitoring, event log, expectations enforcement
- Security questions cover column masks, row filters, external locations — detail-heavy

**Tip:** If you can explain WHY an answer is correct, not just WHAT the answer is, you're ready.
