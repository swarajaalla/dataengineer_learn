---
sidebar_position: 1
---

# Streaming & Events Overview

Streaming is continuous data processing — handling data as it's generated rather than collecting it and processing it in batches. It adds significant complexity and cost. Understand when you actually need it.

---

## Batch vs Streaming in One Line

**Batch:** Process a file. **Streaming:** Process an endless river.

| | Batch | Streaming |
|--|-------|-----------|
| **Dataset** | Bounded (has a start and end) | Unbounded (never ends) |
| **Trigger** | Scheduled or manual | Continuous |
| **Latency** | Minutes to hours | Milliseconds to minutes |
| **Complexity** | Low | High |
| **Cost** | Low (compute runs and stops) | High (compute runs always) |
| **Failure handling** | Re-run the batch | Checkpointing, exactly-once |

---

## The Streaming Landscape

```
Event sources:
  IoT sensors, mobile apps, clickstream, payment systems
  
Message brokers (the queue in the middle):
  Apache Kafka, Azure Event Hubs, AWS Kinesis, Google Pub/Sub
  
Stream processors (the compute):
  Databricks Structured Streaming, Apache Flink, Kafka Streams, Spark Streaming
  
Landing:
  Delta Lake (Bronze), Cosmos DB, Azure SQL, Elasticsearch
```

---

## When Streaming Is Actually Needed

Before building streaming infrastructure, ask: "What happens if this data is 15 minutes old?"

| Use case | Latency that matters? | Streaming needed? |
|----------|----------------------|------------------|
| Fraud detection | Yes — transaction must be blocked in < 2 seconds | Yes |
| IoT equipment alert | Yes — alert on anomaly within 30 seconds | Yes |
| Real-time order tracking | Yes — customer sees live status | Yes |
| Hourly KPI dashboard | No — hourly batch is fine | No |
| Daily financial reports | No — overnight batch | No |
| Monthly analytics | No — batch any time | No |

**Most business reporting does not need streaming.** Build streaming when latency is a business requirement, not because it sounds impressive.

---

## Azure Streaming Stack

```
IoT Hub / Event Hubs
  ├── Kafka-compatible API
  ├── Up to 1 million events/second
  └── Retention: 1-7 days (configurable)
  
  ↓
  
Databricks Structured Streaming
  ├── Micro-batch (30s, 1min, 5min triggers)
  ├── Reads Event Hub as a Kafka source
  └── Writes to Delta Lake (Bronze / Silver)
  
  ↓
  
Delta Lake (Bronze)
  ├── Append-only streaming writes
  └── Downstream batch jobs process delta
```

---

## Key Concepts to Understand

| Concept | What it means |
|---------|--------------|
| **Event** | A record of something that happened, with a timestamp |
| **Topic / Consumer group** | Logical channel in Kafka/Event Hub; consumers track position per group |
| **Offset** | Position in a partition. Consumer reads from offset, advances after processing |
| **Checkpoint** | Saved state of streaming job — where to resume after restart |
| **Watermark** | How late can events arrive and still be processed? After watermark, late events are dropped |
| **Trigger** | How often Structured Streaming processes a micro-batch |
| **Backpressure** | Mechanism to slow the producer when consumer is overwhelmed |
