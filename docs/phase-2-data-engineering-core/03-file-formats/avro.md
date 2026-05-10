---
sidebar_position: 5
---

# Avro

Avro is a row-based binary format with a schema embedded in the file. It's the standard for Kafka and streaming pipelines where schema evolution and compact encoding matter.

---

## What It Is

Avro stores:
1. **Schema** (JSON format) — embedded in the file header
2. **Data** (binary, row-oriented) — compact and fast to serialize

```json
// Avro schema (stored in file header)
{
  "type": "record",
  "name": "Order",
  "namespace": "com.company.orders",
  "fields": [
    {"name": "order_id", "type": "string"},
    {"name": "customer_id", "type": "long"},
    {"name": "order_total", "type": "double"},
    {"name": "status", "type": {"type": "enum", "name": "Status", "symbols": ["PLACED", "SHIPPED", "CANCELLED"]}},
    {"name": "cancelled_reason", "type": ["null", "string"], "default": null}
  ]
}
```

---

## Why Avro Is Standard for Kafka

In Kafka, every message needs to be:
1. **Compact** — millions of messages per second, binary is smaller than JSON text
2. **Self-describing** — consumer needs to know the schema to deserialize
3. **Evolvable** — schema changes happen; consumers should still work

Avro solves all three. Combined with a **Schema Registry**, it's the most robust approach to Kafka serialization.

---

## Schema Registry Pattern

Without schema registry: schema embedded in every Avro file/message → bloated, hard to evolve.

With schema registry: schema stored centrally, message contains only a schema ID.

```
Producer                Schema Registry        Consumer
   │                          │                    │
   ├── register schema ──────►│                    │
   │◄── schema ID (42) ───────┤                    │
   │                          │                    │
   ├── send message: [magic byte][schema_id=42][binary data] ──────────────────►│
   │                          │                    │
   │                          │◄── get schema 42 ──┤
   │                          ├── return schema ───►│
   │                          │                    ├── deserialize using schema
```

Azure Event Hubs has a built-in Schema Registry. Confluent Cloud Schema Registry is used with Kafka.

---

## Schema Evolution in Avro

Avro defines compatibility rules for how schemas can change without breaking producers or consumers:

| Compatibility | What you can do |
|--------------|----------------|
| **Backward** | Add optional fields (with default). Old consumers can read new data. |
| **Forward** | Remove fields. New consumers can read old data. |
| **Full** | Both — only add/remove optional fields with defaults |

```json
// Original schema
{"name": "order_id", "type": "string"}

// Adding a new optional field — backward compatible
{"name": "region", "type": ["null", "string"], "default": null}
// Old consumers that don't know about "region" will just skip it
```

---

## Avro vs Parquet

| Property | Avro | Parquet |
|----------|------|---------|
| **Orientation** | Row | Columnar |
| **Best for** | Write-heavy, streaming | Read-heavy, analytics |
| **Serialization speed** | Very fast | Medium |
| **Compression** | Medium | High (columnar compression more effective) |
| **Schema evolution** | Excellent | Limited |
| **Kafka** | Standard | Not common |
| **Data lake queries** | Slow (row scan) | Fast |
| **Human-readable** | No | No |

**Rule:** Avro for streaming ingestion, Parquet/Delta for analytical storage.

---

## The Real-World Pattern

```
Kafka topic (Avro messages)
     ↓
ADLS Bronze (raw Avro files — keep as-is for replay)
     ↓
Databricks reads Avro, flattens, converts
     ↓
ADLS Silver (Delta format — queryable, optimized)
```

Don't query Avro in your analytics layer. Convert to Delta once it lands.

---

## Reading Avro in Spark

```python
# Spark natively supports Avro with the spark-avro package (included in Databricks)
df = spark.read.format("avro") \
    .load("abfss://bronze@account.dfs.core.windows.net/kafka/orders/")

df.printSchema()
# Schema is read from the Avro file header — no need to define manually

# Write Avro
df.write.format("avro") \
    .mode("append") \
    .save("/bronze/kafka/orders/")
```

---

## When NOT to Use Avro

- **Analytical queries:** Row-oriented = full scan for every query. Use Delta/Parquet instead.
- **Simple batch pipelines:** If you control the format end-to-end and don't need schema evolution, Parquet is simpler.
- **Data sharing with BI tools:** Most BI tools don't natively read Avro. Export as Parquet or Delta.
