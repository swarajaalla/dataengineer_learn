---
sidebar_position: 3
---

# Event-Driven Architecture

Event-driven architecture (EDA) is a design pattern where components communicate through events rather than direct calls. Each component publishes events when something happens; other components react to those events.

---

## Events vs Messages vs Commands

| Type | Definition | Direction | Example |
|------|-----------|----------|---------|
| **Event** | "Something happened" — fact, past tense | Published to anyone interested | `order.placed`, `payment.completed` |
| **Message** | Generic data transfer | Point-to-point | Request → Response |
| **Command** | "Do this thing" — imperative | Sent to specific target | `send_confirmation_email` |

Events are the most decoupled: the publisher doesn't know or care who consumes them. Commands are tightly coupled: the sender knows the receiver.

---

## Core Components

```
Producer                    Broker                      Consumer
(publishes events)          (stores/routes events)      (reacts to events)

Order Service  ──── event ──► Kafka Topic ──── event ──► Inventory Service
                              "orders"         ──── event ──► Notification Service
                                               ──── event ──► Analytics Pipeline
```

**Producer:** The system that creates events. It publishes and moves on — doesn't wait.

**Broker (Kafka / Event Hub):** Stores and routes events. Events are persisted for a configurable retention period. Multiple consumers can read the same events independently.

**Consumer:** Systems that subscribe to events and react. Independent of each other.

---

## What a Well-Designed Event Looks Like

```json
{
  "event_id": "evt-7a2b3c4d-5e6f",         // unique event ID for deduplication
  "event_type": "order.placed",              // what happened
  "event_version": "1.0",                   // schema version
  "occurred_at": "2024-01-15T14:32:01.123Z", // when it happened (not when processed)
  "source": "order-service",                // who produced it
  "aggregate_id": "ORD-123456",             // the entity this event is about
  "data": {
    "order_id": "ORD-123456",
    "customer_id": "C-1001",
    "items": [
      {"sku": "PROD-1", "qty": 2, "price": 49.99}
    ],
    "total": 99.98,
    "currency": "EUR"
  },
  "metadata": {
    "correlation_id": "req-abc123",          // trace ID for request correlation
    "user_agent": "mobile-app-v2.1"
  }
}
```

**Rules for good events:**
- Include `occurred_at` (when the business event happened, not when published)
- Include `event_id` for deduplication (consumer may receive twice)
- Include `event_version` for schema evolution
- Make events self-contained — consumer shouldn't need another API call to understand the event
- Use past tense: `order.placed`, not `place_order`

---

## Ordering and Partitions

Kafka maintains ordering within a partition. Events published to the same partition arrive in the order they were sent.

```
Partition 0: [ORD-001 placed] → [ORD-001 paid] → [ORD-001 shipped]
Partition 1: [ORD-002 placed] → [ORD-002 paid]
Partition 2: [ORD-003 placed]
```

**Key insight:** Use the same partition key for related events that must be ordered. For orders: `partition_key = order_id` ensures all events for one order go to the same partition.

---

## Consumer Groups: Parallel Processing

Multiple consumers in a group share the work. Each partition is assigned to one consumer in the group.

```
Topic: orders (6 partitions)
Consumer Group: analytics-pipeline (3 consumers)

Consumer 1 → reads Partitions 0, 1
Consumer 2 → reads Partitions 2, 3
Consumer 3 → reads Partitions 4, 5
```

Different consumer groups read the same events independently. The analytics pipeline and the notification service both read every event — neither affects the other's offset.

---

## Dead Letter Queue (DLQ)

When an event can't be processed (malformed data, missing field, downstream unavailable), it goes to a Dead Letter Queue rather than blocking the pipeline.

```
Event Hub → Consumer → DLQ (when processing fails after N retries)
                   ↓
             DLQ Monitor job
                   ↓
             Alert + manual investigation
```

In Azure Event Hubs, the DLQ is `<eventhub-name>/$DeadLetterQueue`.

Always implement DLQ handling. Without it, one bad event can block all processing.

---

## Real Architecture: Payment Processing

```
Customer completes checkout
         ↓
Order Service publishes:
  topic: orders, key: ORD-123, event: order.placed
         ↓
         ├──► Inventory Service
         │    Reserves stock, publishes inventory.reserved
         │
         ├──► Payment Service
         │    Charges card, publishes payment.completed or payment.failed
         │
         ├──► Notification Service
         │    Sends order confirmation email
         │
         └──► Analytics Pipeline (Databricks)
              Writes to Delta Bronze → Silver → Gold
              Increments daily revenue counters
```

No service calls another service directly. Each reacts to events. Payment failure doesn't crash the notification service.

---

## Benefits in Data Engineering Context

**Decoupling:** Databricks reads events from Kafka. If Databricks is down for maintenance, Kafka buffers events. When it comes back, it reads from where it left off. No data lost.

**Replayability:** Kafka retains events (default 7 days). If you deploy a bug fix to your streaming job, you can replay events from 7 days ago to reprocess.

**Auditability:** Event log = complete history of everything that happened. `order.placed` events never disappear (until retention expires).

**Scalability:** Add more consumers to scale independently. Adding a new analytics use case = new consumer group, doesn't touch the producer.
