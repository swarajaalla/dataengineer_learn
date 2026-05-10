---
sidebar_position: 6
---

# Change Data Capture (CDC)

CDC captures every INSERT, UPDATE, and DELETE from a source database as it happens. It's the most reliable way to sync data from transactional systems without full table scans.

---

## Why CDC

**Without CDC (full load):**
- Extract 50M rows every night → slow, high source load, misses deletes
- Can't detect what changed → harder to apply incremental updates in target

**Without CDC (watermark-based):**
- Only catches rows where `updated_at > last_run`
- Misses hard deletes (deleted rows have no updated_at)
- Depends on source maintaining timestamps correctly (often they don't)

**With CDC:**
- Captures every change as it happens
- Includes deletes (the row that was deleted)
- Ordered by time — guaranteed sequence
- Minimal source load (reads the transaction log, not the table)

---

## CDC Methods Compared

| Method | How it works | Reliability | Source impact | Complexity |
|--------|-------------|------------|---------------|-----------|
| **Log-based** | Reads DB transaction log | Highest | Very low | High |
| **Trigger-based** | DB triggers write changes to a change table | High | Medium (trigger overhead) | Medium |
| **Timestamp-based** | Query `WHERE updated_at > last_run` | Medium (misses deletes) | Medium | Low |
| **Query diff** | Compare full snapshots | Low (slow, misses deletes) | High | Medium |

Use log-based CDC for production. It's the only method that catches deletes and doesn't impact source performance.

---

## Log-Based CDC: How It Works

Every transactional database writes changes to a write-ahead log (WAL) before applying them. CDC tools read this log:

```
Application inserts order
         ↓
Transaction log: [LSN=1001] INSERT INTO orders VALUES ('ORD-123', ...)
         ↓
CDC connector (Debezium) reads log continuously
         ↓
Publishes change event to Kafka:
{
  "op": "c",                           ← c=create, u=update, d=delete
  "before": null,
  "after": {
    "order_id": "ORD-123",
    "customer_id": 456,
    "total": 99.99,
    "status": "PLACED"
  },
  "ts_ms": 1705312800000
}
```

---

## CDC Tools

| Tool | Source systems | Target | Notes |
|------|---------------|--------|-------|
| **Debezium** | MySQL, SQL Server, PostgreSQL, Oracle, MongoDB | Kafka | Open-source, widely used |
| **ADF CDC connector** | SQL Server, Oracle | ADLS / Azure SQL | Native ADF, simpler setup |
| **Fivetran** | 300+ sources | Snowflake, BigQuery, Databricks | SaaS, expensive |
| **Azure SQL CDC** | Azure SQL Database | Event Hub / ADF | Native feature of Azure SQL |
| **Oracle GoldenGate** | Oracle | Multiple | Enterprise, expensive |

---

## CDC Output Format: Before/After Image

```json
// UPDATE: customer changed email
{
  "op": "u",
  "before": {
    "customer_id": 1001,
    "email": "old@acme.com",
    "region": "DE"
  },
  "after": {
    "customer_id": 1001,
    "email": "new@acme.com",
    "region": "DE"
  },
  "ts_ms": 1705312800000,
  "source": {"table": "customers", "lsn": "0x0001A2B3"}
}

// DELETE: order cancelled and removed
{
  "op": "d",
  "before": {
    "order_id": "ORD-999",
    "customer_id": 456,
    "total": 50.00
  },
  "after": null,
  "ts_ms": 1705312900000
}
```

---

## Applying CDC in Databricks: MERGE INTO

Land CDC events as-is in Bronze. Apply them to Silver using MERGE:

```python
from delta.tables import DeltaTable

# CDC feed: stream of change events from Bronze
cdc_df = spark.readStream \
    .format("delta") \
    .load("/bronze/cdc/customers/")

def apply_cdc_to_silver(batch_df, batch_id):
    # Separate inserts/updates from deletes
    upserts = batch_df.filter("op IN ('c', 'u')")
    deletes = batch_df.filter("op = 'd'")
    
    silver_table = DeltaTable.forPath(spark, "/silver/customers/")
    
    # Apply upserts
    if upserts.count() > 0:
        silver_table.alias("target").merge(
            upserts.select("after.*").alias("source"),
            "target.customer_id = source.customer_id"
        ).whenMatchedUpdateAll() \
         .whenNotMatchedInsertAll() \
         .execute()
    
    # Apply deletes
    if deletes.count() > 0:
        delete_ids = deletes.select("before.customer_id")
        silver_table.alias("target").merge(
            delete_ids.alias("source"),
            "target.customer_id = source.customer_id"
        ).whenMatchedDelete() \
         .execute()

# Apply in micro-batch
cdc_df.writeStream \
    .foreachBatch(apply_cdc_to_silver) \
    .option("checkpointLocation", "/checkpoints/silver/customers_cdc") \
    .trigger(processingTime="1 minute") \
    .start()
```

---

## Real Pattern: SQL Server → CDC → Databricks → Delta

```
SQL Server (source)
  → SQL Server CDC enabled on target tables
  → Debezium connector reads SQL Server transaction log
  → Publishes to Kafka topic: sqlserver.dbo.orders

Kafka topic
  → Databricks Structured Streaming reads Avro messages
  → Writes raw CDC events to Delta Bronze (append-only audit log)

Delta Bronze (raw CDC)
  → Databricks MERGE job (every minute)
  → Applies C/U/D to Delta Silver (current state of orders)

Delta Silver
  → Downstream jobs read current state for aggregation
```

---

## Common Pitfalls

| Pitfall | Problem | Fix |
|---------|---------|-----|
| **Schema changes in source** | New column added → CDC events break | Enable schema registry, use schema evolution |
| **Out-of-order events** | Network delay causes events to arrive late | Sort by LSN/timestamp before applying |
| **Duplicate events** | Kafka redelivery on consumer restart | Use `batch_id` deduplication or MERGE (idempotent) |
| **Large initial load** | Table has 100M rows at CDC start | Run initial snapshot separately (full load), then CDC for ongoing changes |
| **CDC lag** | Log reader falls behind high-write sources | Scale Kafka partitions, Debezium connector workers |
