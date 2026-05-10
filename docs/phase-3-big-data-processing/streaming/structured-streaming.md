---
sidebar_position: 1
---

# Spark Structured Streaming

Structured Streaming is Spark's streaming API. It uses the same DataFrame interface as batch — easy to switch between modes.

---

## How It Works

Structured Streaming treats a live data stream as an unbounded table that grows continuously.

```
Stream source (Kafka / Event Hubs / files)
        ↓
Trigger: every N seconds or on new data
        ↓
Micro-batch: read new data since last checkpoint
        ↓
Apply transformations (same as batch)
        ↓
Write to sink (Delta / Kafka / console)
        ↓
Update checkpoint (record progress)
```

---

## Read from Kafka

```python
df_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "broker1:9092,broker2:9092") \
    .option("subscribe", "orders_topic") \
    .option("startingOffsets", "latest") \
    .option("failOnDataLoss", "false") \
    .load()

# Kafka gives: key, value, topic, partition, offset, timestamp
# Value is binary — parse it
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, DoubleType, TimestampType

schema = StructType() \
    .add("order_id", StringType()) \
    .add("customer_id", StringType()) \
    .add("amount", DoubleType()) \
    .add("event_time", TimestampType())

df_parsed = df_stream \
    .select(from_json(col("value").cast("string"), schema).alias("data")) \
    .select("data.*")
```

---

## Read from Azure Event Hubs

```python
from pyspark.sql.functions import col

connection_string = dbutils.secrets.get("kv-scope", "eventhubs-connection-string")

eventhubs_config = {
    "eventhubs.connectionString": sc._jvm.org.apache.spark.eventhubs.EventHubsUtils.encrypt(
        spark.sparkContext._jvm, connection_string
    )
}

df_stream = spark.readStream \
    .format("eventhubs") \
    .options(**eventhubs_config) \
    .load()
```

---

## Write to Delta Lake (Standard Sink)

```python
query = df_parsed.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/mnt/checkpoints/orders_stream") \
    .trigger(processingTime="1 minute") \    # micro-batch every minute
    .table("silver.streaming_orders")

query.awaitTermination()
```

---

## Trigger Modes

```python
# Micro-batch: run every N seconds (most common)
.trigger(processingTime="30 seconds")

# Once: process all available data and stop (like batch)
.trigger(once=True)

# Continuous: lowest latency (experimental, < 100ms)
.trigger(continuous="1 second")

# Available Now: process all available, then stop (like once but more efficient)
.trigger(availableNow=True)
```

---

## Checkpoints — Critical

The checkpoint location stores what data has been processed. Without it, the stream starts from scratch on restart.

```python
.option("checkpointLocation", "/mnt/checkpoints/my_stream")
```

- Use ADLS path (not DBFS) in production
- Never share checkpoint directories between different streams
- Never delete checkpoints unless you want to reprocess from start

---

## Output Modes

```python
.outputMode("append")    # only add new rows (default for event streams)
.outputMode("complete")  # rewrite entire result (only for aggregations)
.outputMode("update")    # only write changed rows (aggregations only)
```

For non-aggregated streams writing to Delta, always use `append`.

---

## Streaming with Aggregations

```python
from pyspark.sql.functions import window, sum, count

df_agg = df_parsed \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),   # 5-minute window
        col("region")
    ) \
    .agg(
        sum("amount").alias("total_revenue"),
        count("order_id").alias("order_count")
    )

query = df_agg.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/mnt/checkpoints/revenue_agg") \
    .table("gold.streaming_revenue_5min")
```
