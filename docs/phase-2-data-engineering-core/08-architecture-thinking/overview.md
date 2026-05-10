---
sidebar_position: 1
---

# Architecture Thinking

Good data engineers don't just implement pipelines — they design systems that handle failure, scale under load, and stay maintainable as requirements change.

---

## The Questions to Ask Before Designing

Before writing a single line of code or drawing a single box:

**About the data:**
- What is the source? Who owns it? How reliable is it?
- What's the volume? How does it grow over time?
- How often does it change? Are changes incremental or full?
- What format does it come in? Can the format change without notice?

**About the requirements:**
- What latency does the business actually need? (Hours? Minutes? Seconds?)
- Who consumes the data? What tool do they use?
- What's the SLA? What happens if the pipeline is late?
- How long must historical data be retained?

**About failure:**
- What happens if the source is unavailable for 2 hours?
- What happens if the pipeline writes duplicates?
- What happens if a schema change in the source breaks the pipeline silently?
- Who gets paged at 2 AM when this fails?

---

## Architecture Trade-offs

Every architectural decision is a trade-off. There is no perfect architecture — only the right trade-off for your context.

| Trade-off | Option A | Option B |
|-----------|---------|---------|
| **Latency vs Cost** | Streaming (low latency, high cost) | Batch (high latency, low cost) |
| **Simplicity vs Flexibility** | Fixed schema (simple) | Schema-on-read (flexible) |
| **Decoupling vs Consistency** | Event-driven (decoupled) | Synchronous (consistent) |
| **Performance vs Cost** | Always-on cluster | Auto-scaling cluster |
| **Completeness vs Speed** | Full load (complete) | Incremental (fast) |

---

## Architecture Anti-Patterns

**The Data Swamp:** Drop everything in a lake with no catalog, no ownership, no schema. Six months later, nobody knows what's in there.

**The God Pipeline:** One giant ADF pipeline that does ingestion, transformation, modeling, and validation in one flow. Impossible to debug, impossible to reuse.

**Transform at Ingestion:** Business logic baked into ADF Data Flows during copy. When logic changes, you must re-ingest. No raw data to fall back to.

**No Idempotency:** Pipelines that create duplicates on re-run. Every failure requires manual data cleanup.

**Premature Streaming:** Streaming for daily batch data because it sounds more impressive. Adds cost and operational complexity for no benefit.

**Over-partitioning:** Partitioning by hour and product and region creates millions of tiny partitions. Spark spends more time on file listing than computation.

---

## How to Communicate Architecture

**Text diagrams for quick communication:**
```
Source → ADF → Bronze (ADLS) → Databricks → Silver → Gold → Power BI
```

**Architecture Decision Records (ADRs):**
A short document that captures: what was decided, why, what alternatives were considered, what the consequences are. Useful when someone asks "why did you do it this way?" 6 months later.

**Runbooks:**
Step-by-step instructions for operating the platform: how to re-run a failed pipeline, how to backfill a date range, how to handle a schema change.
