---
sidebar_position: 4
---

# Kafka Introduction

Apache Kafka is the standard distributed event streaming platform. Understanding its core concepts is essential because Azure Event Hubs uses the same Kafka API, and Databricks reads from both using identical code.

---

## What Kafka Is

Kafka is a distributed, fault-tolerant message broker that stores and delivers events with high throughput and low latency.

**Key properties:**
- **Distributed:** Multiple brokers share the load
- **Durable:** Events written to disk, replicated across brokers
- **Replayable:** Consumers can re-read events (configurable retention)
- **High throughput:** Millions of events per second
- **Multi-consumer:** Many consumers read the same data independently

---

## Core Concepts

**Broker:** A Kafka server. A cluster has multiple brokers (typically 3–9 in production).

**Topic:** A named channel for events. Similar to a database table — you publish events to a topic and subscribe to read from it.

**Partition:** A topic is split into partitions. Each partition is an ordered, append-only log stored on disk.

```
Topic: "orders" (4 partitions)
  Partition 0: [event 0] [event 1] [event 3] [event 7] ...
  Partition 1: [event 2] [event 5] [event 9] ...
  Partition 2: [event 4] [event 8] ...
  Partition 3: [event 6] ...
```

Events are ordered within a partition but not across partitions.

**Offset:** A sequential integer identifying each event's position within a partition. Consumer tracks its current offset per partition.

**Producer:** The application that publishes events to a topic.

**Consumer:** The application that reads events from a topic.

**Consumer Group:** A logical grouping of consumers. Each partition is assigned to exactly one consumer in the group. Enables parallel consumption.

---

## Partitions and Parallelism

More partitions = more parallel consumers = higher throughput.

```
Topic with 3 partitions → max 3 consumers in parallel (one per partition)
Topic with 12 partitions → max 12 consumers in parallel
```

**Choosing partition count:**
- Set it based on your expected peak throughput
- Increasing partitions later requires rebalancing — plan ahead
- Azure Event Hubs: up to 1024 partitions (Premium tier)

---

## Retention: Kafka Keeps Data

Unlike a traditional message queue (delete after consume), Kafka retains events on disk for a configurable period.

```yaml
retention.ms: 604800000    # 7 days (default)
retention.bytes: 1073741824 # 1 GB per partition
```

**Why this matters:**
- A consumer can re-read events from 7 days ago
- If your Databricks job was down for 2 days, it resumes from where it left off — no data lost
- You can deploy a fixed consumer and replay history

---

## Azure Event Hubs: Kafka-Compatible

Azure Event Hubs exposes a Kafka-compatible endpoint. Your Kafka code works with Event Hubs with minimal config changes:

| Kafka concept | Event Hubs equivalent |
|--------------|----------------------|
| Broker | Event Hubs namespace |
| Topic | Event Hub |
| Partition | Partition (same concept) |
| Consumer Group | Consumer Group (same concept) |
| Retention | Retention period (1–90 days, configurable) |
| Schema Registry | Event Hubs Schema Registry (built-in) |

```python
# Databricks: same code reads from Kafka or Event Hubs
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", 
            "mynamespace.servicebus.windows.net:9093") \   # Event Hubs endpoint
    .option("subscribe", "orders-topic") \
    .option("kafka.security.protocol", "SASL_SSL") \
    .option("startingOffsets", "earliest") \  # or "latest"
    .load()
```

---

## Producer Code (Python)

```python
from confluent_kafka import Producer

producer = Producer({
    "bootstrap.servers": "broker1:9092,broker2:9092",
    "acks": "all",          # wait for all replicas to confirm (durability)
    "retries": 5,
    "linger.ms": 10         # batch events for 10ms before sending (throughput)
})

def delivery_callback(err, msg):
    if err:
        print(f"Delivery failed for {msg.key()}: {err}")
    else:
        print(f"Delivered to {msg.topic()}[{msg.partition()}] @ offset {msg.offset()}")

producer.produce(
    topic="orders",
    key="ORD-123",              # partition key — same key → same partition
    value=json.dumps(order_event).encode("utf-8"),
    callback=delivery_callback
)
producer.flush()  # wait for all pending messages to be delivered
```

---

## Consumer Code (Python)

```python
from confluent_kafka import Consumer

consumer = Consumer({
    "bootstrap.servers": "broker1:9092",
    "group.id": "analytics-pipeline",
    "auto.offset.reset": "earliest",   # start from beginning if no committed offset
    "enable.auto.commit": False        # manually commit offsets (more control)
})

consumer.subscribe(["orders"])

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        
        if msg is None:
            continue
        if msg.error():
            print(f"Error: {msg.error()}")
            continue
        
        # Process the message
        event = json.loads(msg.value())
        process_order_event(event)
        
        # Manually commit offset after successful processing
        consumer.commit(asynchronous=False)
finally:
    consumer.close()
```

---

## When to Use Kafka vs Azure Service Bus

| Use case | Kafka / Event Hubs | Azure Service Bus |
|----------|-------------------|------------------|
| High throughput (> 1M events/sec) | Yes | No (max ~10K/sec) |
| Multiple consumers reading same data | Yes | No (standard queue delivers once) |
| Event replay/reprocessing | Yes | No |
| Ordered delivery per entity | Yes (per partition) | No (standard queues) |
| Low volume, simple queue | Overkill | Yes |
| Request-reply pattern | No | Yes |
| Dead letter queue needed | Manual implementation | Built-in |

Use Kafka/Event Hubs for high-throughput streaming data. Use Service Bus for application-level messaging and workflow coordination.

---

## When NOT to Use Kafka

- Volume is low (< 1000 events/minute) — Service Bus is simpler
- You need request-reply (synchronous) patterns — use HTTP or Service Bus
- Team has no Kafka operations experience — start with Service Bus or Event Grid
- Budget is limited — always-on Event Hubs namespace has a base cost
