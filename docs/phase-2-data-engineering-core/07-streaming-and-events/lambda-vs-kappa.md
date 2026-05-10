---
sidebar_position: 5
---

# Lambda vs Kappa Architecture

Two approaches to building data platforms that serve both batch and real-time needs. The debate between them reflects the fundamental tension between accuracy and speed.

---

## Lambda Architecture

Proposed by Nathan Marz (2011). Combines a batch layer for accuracy and a speed layer for low latency.

```
                    ┌──────────────────────────────────────────┐
                    │          BATCH LAYER                      │
                    │  Recomputes everything periodically       │
                    │  (Spark batch job, once per day)          │
                    │  Output: accurate, complete               │
                    └──────────────────┬───────────────────────┘
                                       │
Source events ─────────────────────────┤──────────────────────────► Serving
                                       │         Layer
                    ┌──────────────────┴───────────────────────┐
                    │          SPEED LAYER                      │
                    │  Processes recent events only             │
                    │  (Spark Streaming, last few hours)        │
                    │  Output: approximate, fast                │
                    └──────────────────────────────────────────┘
```

**How it works:**
- Batch layer processes ALL historical data nightly → creates accurate "batch views"
- Speed layer processes only recent data in real-time → creates "real-time views"
- Serving layer merges both: batch views for history, real-time views for the last few hours

---

## Lambda: The Core Problem

You maintain **two separate codebases** doing the same logic:

```python
# Batch layer (Spark):
daily_revenue = orders_df.groupBy("date", "region").agg(sum("revenue"))

# Speed layer (Kafka Streams / Flink):
current_revenue = order_stream.groupByKey().aggregate(revenue_accumulator)

# Same business logic: "sum revenue by date and region"
# Implemented twice, in different frameworks, by different teams
```

When the business logic changes, you change it in two places. When they diverge (and they will), results are inconsistent. "Why does the dashboard show different numbers depending on the time of day?"

---

## Kappa Architecture

Proposed by Jay Kreps (2014). Process everything as streaming — no separate batch layer.

```
Source events
     ↓
Kafka (long retention — stores all events for years)
     ↓
Streaming processor (Flink or Spark Structured Streaming)
     ↓
Serving layer (Delta Lake, database, cache)
```

**For reprocessing historical data:** Replay Kafka from offset 0. Same streaming job processes historical events at high speed (unbounded throughput when not rate-limited by real-time load).

**The key requirement:** Kafka must retain events long enough to replay history.

---

## Lambda vs Kappa Comparison

| Property | Lambda | Kappa |
|----------|--------|-------|
| **Codebases** | Two (batch + streaming) | One (streaming only) |
| **Consistency** | Results may differ between layers | Single source of truth |
| **Reprocessing** | Re-run batch | Replay Kafka from beginning |
| **Latency** | Low (speed layer) + accurate (batch) | Low |
| **Complexity** | High (two systems) | Medium (one streaming system) |
| **Kafka retention** | Short retention OK | Long retention required |
| **Operational overhead** | High | Medium |

---

## Why Delta Lake Makes Kappa More Viable

Before Delta Lake, streaming writes created many small files that were slow to read for batch analytics. You needed a separate batch layer to compact and organize data.

With Delta Lake:
- Streaming writes to Delta (micro-batch, every 30 seconds)
- `OPTIMIZE` compacts files periodically
- Batch queries on Delta are fast regardless of how data was written

```python
# One pipeline handles both streaming ingest and batch queries
parsed_stream.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/orders") \
    .outputMode("append") \
    .trigger(processingTime="30 seconds") \
    .start("/silver/orders/")

# Batch query on the same Delta table
df = spark.read.format("delta").load("/silver/orders/") \
    .filter(col("order_date") == "2024-01-15") \
    .groupBy("region").agg(sum("revenue"))
```

---

## The Reality: Most Companies Use a Hybrid

Pure Lambda: Two separate systems, hard to maintain.
Pure Kappa: Requires long Kafka retention and replay capability — infrastructure cost.

**Practical pattern in Azure (Hybrid):**

```
Source DB → CDC (Debezium) → Kafka → Streaming → Delta Bronze (near-real-time)
Source DB → ADF batch → Delta Bronze (daily full reconciliation)

Both feed into Silver MERGE → Gold → reporting
```

The CDC stream handles near-real-time. The daily batch handles corrections, late arrivals, and ensures completeness. No separate "speed view" — just one Delta table with fresher data due to streaming writes.

---

## Which to Use

**Choose Lambda when:**
- Real-time view only needs recent hours (not full history via stream)
- Batch reprocessing needs are infrequent
- Teams are separated (streaming team vs batch team)

**Choose Kappa when:**
- Kafka retention is long (months)
- Single codebase is a priority
- Streaming team is mature

**Choose Hybrid when:**
- Using Databricks + Delta + Event Hubs (the Azure default)
- You want streaming freshness without abandoning reliable batch reprocessing
- Most companies end up here
