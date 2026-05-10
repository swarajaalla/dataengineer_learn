---
sidebar_position: 2
---

# Batch vs Streaming

Understanding when to choose batch, micro-batch, or streaming is one of the most important architectural decisions in data engineering. Getting it wrong costs money and adds unnecessary complexity.

---

## Batch Processing

Process a bounded, finite dataset on a schedule.

```
00:00 AM  →  Extract yesterday's orders (50M rows)
00:30 AM  →  Transform and load to Silver
01:30 AM  →  Build Gold aggregations
02:30 AM  →  Power BI refresh complete
```

**Properties:**
- Dataset has a clear start and end
- High throughput (process millions of rows efficiently)
- High latency (hours between when data is created and when it's visible)
- Simple failure handling (re-run the batch)
- Compute starts and stops (pay only while running)

---

## Streaming Processing

Process an unbounded, continuous stream of events in near-real-time.

```
Payment event arrives at 14:32:01.123
→ processed by streaming job at 14:32:01.450 (< 1 second latency)
→ fraud model checks the transaction
→ alert sent at 14:32:01.800 if suspicious
```

**Properties:**
- Dataset never ends — always more events arriving
- Low latency (seconds to sub-second)
- Always-on compute (cluster never stops)
- Complex failure handling (checkpointing, exactly-once semantics)
- High operational cost

---

## Micro-Batch: The Middle Ground

Spark Structured Streaming is not true streaming — it's micro-batch. It collects events for a short window (30 seconds, 1 minute), then processes them as a mini-batch.

```
Events arrive continuously from Event Hub
  ├── 00:00 - 00:30  →  batch of 15,000 events collected
  │                  →  Spark job runs, writes to Delta Bronze
  ├── 00:30 - 01:00  →  next batch collected
  └── ...continues every 30 seconds
```

**Properties:**
- Latency: 30 seconds to 5 minutes (configurable trigger interval)
- Simpler than true streaming (Flink-style)
- Much lower latency than batch
- Higher cost than batch (always-on cluster)

**This is what most "streaming" in Azure Databricks actually is.**

---

## Latency Requirements → Architecture Choice

| Latency requirement | Architecture | Tools |
|--------------------|-------------|-------|
| < 1 second | True streaming | Flink, Kafka Streams |
| 1–60 seconds | Micro-batch | Databricks Structured Streaming |
| 1–15 minutes | Micro-batch or event-triggered batch | Databricks Structured Streaming |
| 15 minutes–1 hour | Scheduled batch | ADF + Databricks |
| > 1 hour | Scheduled batch | ADF + Databricks (simplest) |

**Ask first:** What latency does the business actually need? Not what sounds impressive — what decision changes if data is 5 minutes old vs 1 hour old?

---

## Cost Comparison

**Batch (1-hour window):**
- Cluster runs for 45 minutes each hour
- Cost: $5/hour × 0.75 = $3.75/hour = $90/day

**Micro-batch streaming:**
- Cluster runs 24/7 (always-on)
- Cost: $5/hour × 24 = $120/day

**The streaming tax:** $120/day vs $90/day (but only if batch truly runs hourly — most run daily, making batch much cheaper).

For a daily batch pipeline, streaming costs 24x more.

---

## The Lambda Architecture (Brief)

Combines batch and streaming to get both accuracy and speed.

```
                    ┌─ Batch Layer (recomputes everything, accurate) ─┐
Source events ──────┤                                                  ├──► Serving
                    └─ Speed Layer (real-time approximation, fast)    ─┘
```

**Problem:** You maintain two codebases for the same logic. When batch logic and speed layer logic diverge, results are inconsistent.

---

## When to Stick with Batch

- All dashboards are viewed in the morning → overnight batch is fine
- Source system only exports data once a day (SAP, daily file drop)
- SLA is "data available by 6 AM" → batch that completes by 5:30 AM works
- Team doesn't have streaming operations experience
- Budget doesn't support always-on clusters

**Most enterprise data pipelines should be batch.** The default should be batch; streaming should require justification.
