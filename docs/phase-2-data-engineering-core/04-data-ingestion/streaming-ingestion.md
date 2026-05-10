---
sidebar_position: 5
---

# Streaming Ingestion

Streaming ingestion moves data continuously as it's generated — no waiting for a scheduled batch window. It's complex and expensive, so only use it when latency actually matters.

---

## What It Is

Unlike batch (run once, load bounded data, stop), streaming pipelines run continuously:

```
Event Hub / Kafka
  → Always-on Databricks streaming job
  → Writes to Delta table every 30 seconds
  → Table always has data from < 1 minute ago
```

---

## When You Actually Need Streaming

| Use case | Latency needed | Streaming needed? |
|----------|---------------|------------------|
| Overnight financial reports | Hours | No — batch is fine |
| Hourly KPI dashboard | 1 hour | No — hourly batch |
| Fraud detection | < 5 seconds | Yes |
| IoT equipment monitoring | < 30 seconds | Yes |
| Real-time order tracking | < 1 minute | Maybe (micro-batch) |
| Daily sales reports | 24 hours | No |

**The honest answer:** Most business intelligence doesn't need streaming. Analysts check dashboards once a day. Streaming adds cost and operational overhead for no benefit in those cases.

---

## Azure Streaming Architecture

```
IoT Sensors / App Events / CDC
         ↓
   Azure Event Hubs
   (Kafka-compatible, managed)
         ↓
Databricks Structured Streaming
   (always-on cluster)
         ↓
   Delta Table (Bronze)
   (micro-batch writes every 30s)
         ↓
Databricks batch job (Silver processing, every 15 min)
```

---

## Databricks Structured Streaming Basics

Spark Structured Streaming is **micro-batch**, not true streaming. It processes small chunks of data at regular intervals.

```python
# Read from Event Hub (Kafka-compatible protocol)
df_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "mynamespace.servicebus.windows.net:9093") \
    .option("subscribe", "orders-topic") \
    .option("kafka.security.protocol", "SASL_SSL") \
    .option("kafka.sasl.mechanism", "PLAIN") \
    .option("kafka.sasl.jaas.config", 
            f"kafkashaded.org.apache.kafka.common.security.plain.PlainLoginModule "
            f"required username=\"$ConnectionString\" "
            f"password=\"{event_hub_conn_str}\";") \
    .load()

# Parse the JSON value column
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import *

schema = StructType([
    StructField("order_id", StringType()),
    StructField("customer_id", LongType()),
    StructField("total", DoubleType()),
    StructField("ts", TimestampType())
])

parsed = df_stream \
    .select(from_json(col("value").cast("string"), schema).alias("data")) \
    .select("data.*")

# Write to Delta (Bronze)
query = parsed.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/bronze/orders") \
    .outputMode("append") \
    .trigger(processingTime="30 seconds") \  # micro-batch every 30 seconds
    .start("/bronze/events/orders/")

query.awaitTermination()
```

---

## Checkpointing: Critical for Exactly-Once

The checkpoint tells Structured Streaming where it left off. Without it:
- Cluster restart → reprocesses all data from the beginning → duplicates
- Or worse: starts from latest offset → missed data

```python
.option("checkpointLocation", "/checkpoints/bronze/orders/")
# Stores in ADLS: offsets read, processed batches, pending commits
```

**Never share a checkpoint between two streaming jobs.** Each job needs its own checkpoint directory.

---

## Trigger Modes

```python
# Process as fast as possible (continuous micro-batch)
.trigger(processingTime="0 seconds")

# Fixed interval (most common)
.trigger(processingTime="30 seconds")

# Run once, process everything available, stop (good for scheduled use)
.trigger(once=True)

# Run once per trigger (Databricks-optimized, replaces once=True)
.trigger(availableNow=True)
```

For production streaming: `processingTime="30 seconds"` to `"5 minutes"` depending on latency requirement.

---

## Auto Loader: File-Based Streaming

If data arrives as files in ADLS (not from a message queue), use Databricks Auto Loader instead of Kafka:

```python
df_stream = spark.readStream \
    .format("cloudFiles") \
    .option("cloudFiles.format", "json") \
    .option("cloudFiles.schemaLocation", "/schemas/orders") \  # auto-detected schema
    .load("abfss://bronze@account.dfs.core.windows.net/incoming/orders/")

# Auto Loader tracks which files were processed using checkpoints
# New files in the folder trigger processing automatically
```

Auto Loader handles:
- File tracking (no reprocessing)
- Schema inference + evolution
- Efficient file listing on large ADLS directories

---

## Backpressure Handling

If the source produces faster than the consumer processes:

```python
# Limit the maximum data processed per micro-batch
.option("maxOffsetsPerTrigger", 10000)  # Kafka: max 10K messages per batch
.option("maxFilesPerTrigger", 100)      # Auto Loader: max 100 files per batch
```

This prevents the streaming job from being overwhelmed and crashing.

---

## Real Scenario: IoT Sensor Data

```
20,000 sensors × 1 message/second = 20,000 messages/second

Architecture:
- Event Hub: 32 partitions to handle throughput
- Databricks cluster: 8 workers, always-on
- Trigger interval: 30 seconds (acceptable latency for monitoring)
- Output: Delta Bronze table, partitioned by date + sensor_id
- Downstream: 15-minute batch job aggregates to Silver (avg, min, max per sensor)
- Alert: Azure Monitor alert if streaming lag > 5 minutes
```
