---
sidebar_position: 1
---

# Kafka: Brokers, Topics, and Partitions

Apache Kafka is the standard real-time event streaming platform. Used for high-throughput data ingestion and event-driven pipelines.

---

## What Is Kafka?

Kafka is a distributed message queue. Producers write events, consumers read them. Events are stored durably and can be replayed.

```
Producer (source app)
        ↓
Kafka Cluster (brokers store events)
        ↓
Consumer (your Spark streaming job, microservice, etc.)
```

Key characteristic: **events are retained** even after consumption. Different consumers can read the same event at different times.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Broker** | A single Kafka server — stores partitions and serves producers/consumers |
| **Topic** | Named stream of events — like a table, but ordered and append-only |
| **Partition** | A topic is split into N partitions for parallelism |
| **Offset** | Position of an event within a partition — used to track progress |
| **Producer** | Application that writes events to Kafka |
| **Consumer** | Application that reads events from Kafka |
| **Consumer Group** | Multiple consumers sharing work — each partition assigned to one consumer |
| **Retention** | How long events are kept (default: 7 days) |

---

## Topics and Partitions

```
orders_topic (4 partitions)
├── Partition 0: [offset 0, 1, 2, 3, ...]
├── Partition 1: [offset 0, 1, 2, ...]
├── Partition 2: [offset 0, 1, ...]
└── Partition 3: [offset 0, 1, 2, 3, 4, ...]
```

**Partitions enable parallelism:**  
More partitions → more consumers can work in parallel → higher throughput.

**Partition key:** Events with the same key always go to the same partition, preserving order for that key.

```python
# Producer sends order events — keyed by customer_id
# All events for customer_id=C001 always go to partition 2
producer.send("orders_topic", key="C001".encode(), value=event_json.encode())
```

---

## Producer (Python)

```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=["broker1:9092", "broker2:9092"],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    key_serializer=str.encode,
    acks="all",                   # wait for all replicas to confirm
    retries=3,
)

event = {"order_id": "O001", "amount": 500.0, "event_time": "2024-01-15T08:00:00"}
producer.send("orders_topic", key="customer_1", value=event)
producer.flush()
```

---

## Consumer (Python)

```python
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    "orders_topic",
    bootstrap_servers=["broker1:9092"],
    group_id="orders_processor",
    auto_offset_reset="earliest",   # start from beginning if no committed offset
    value_deserializer=lambda v: json.loads(v.decode("utf-8")),
)

for message in consumer:
    event = message.value
    partition = message.partition
    offset = message.offset
    print(f"Partition {partition}, Offset {offset}: {event}")
```

---

## Kafka vs Azure Event Hubs

Azure Event Hubs is the Azure-native equivalent of Kafka and is **Kafka protocol compatible** — you can use the same Kafka client code.

| | Apache Kafka | Azure Event Hubs |
|--|-------------|-----------------|
| **Managed** | Self-managed or Confluent Cloud | Fully managed by Azure |
| **Protocol** | Kafka protocol | Kafka protocol (compatible) |
| **Scaling** | Managed manually | Auto-scale (premium/dedicated) |
| **Cost** | Infrastructure cost | Per-throughput-unit pricing |
| **Best for** | Full control, multi-cloud | Azure-first stacks |

Switch from Kafka to Event Hubs (or vice versa) with minimal code change — just update the bootstrap server address.
