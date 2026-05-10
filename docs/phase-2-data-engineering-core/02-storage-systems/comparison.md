---
sidebar_position: 4
---

# Storage Systems: Full Comparison

Warehouses, lakes, and lakehouses aren't competing alternatives — they coexist in most enterprises. The question is which layer owns what.

---

## Full Comparison Table

| Property | OLTP DB | Data Lake | Data Warehouse | Lakehouse |
|----------|---------|-----------|---------------|-----------|
| **Purpose** | Run the app | Store everything | Analyze structured data | Analytics + ML on one platform |
| **Schema** | Schema on write (strict) | Schema on read (flexible) | Schema on write (strict) | Schema on write (enforced at table level) |
| **Data types** | Structured | Any | Structured | Any |
| **ACID** | Yes | No (plain files) | Yes | Yes (Delta Lake) |
| **DML** | Full (INSERT/UPDATE/DELETE) | Overwrite only | Full | Full (MERGE, UPDATE, DELETE) |
| **Query performance** | Fast (indexed, single row) | Slow (full scans) | Fast (columnar, partitioned) | Fast (columnar + Z-order + file stats) |
| **Cost at scale** | Expensive (IOPS, compute) | Cheap (object storage) | Expensive (reserved compute) | Medium (compute only when needed) |
| **Data freshness** | Real-time | Minutes–hours | Minutes–hours | Minutes–hours |
| **Azure service** | Azure SQL, Cosmos DB | ADLS Gen2 | Synapse Dedicated, Snowflake | Databricks + ADLS |

---

## Decision Framework

**Start here:** What is the primary use case?

```
Powering an application (CRUD operations)
  → Use OLTP: Azure SQL, Cosmos DB

Storing raw data from many sources, not yet modeled
  → Use Data Lake: ADLS Gen2 (Bronze layer)

Structured BI reporting, SQL-only team, < 100 TB
  → Use Data Warehouse: Synapse, Snowflake

Mixed workloads: BI + ML + streaming, large scale, semi-structured data
  → Use Lakehouse: Databricks + Delta on ADLS
```

---

## How They Coexist in a Real Enterprise

This is the actual pattern — not "one replaces the other":

```
SAP / Dynamics / APIs (OLTP sources)
         ↓ ADF ingestion
ADLS Bronze (Data Lake — raw, all formats)
         ↓ Databricks processing
ADLS Silver/Gold (Lakehouse — Delta, governed)
         ↓
Databricks SQL Warehouse ←→ Power BI (analytics)
         ↓
Synapse Dedicated Pool (optional — legacy BI teams)
         ↓
Azure SQL (operational reports that need row-level live data)
```

The lake is the foundation. The lakehouse (Delta) sits on top of it. The warehouse (Synapse/Snowflake) may still exist for specific BI teams or compliance requirements.

---

## Cost Comparison: Where Things Get Expensive

| Layer | Storage cost | Compute cost | What drives cost |
|-------|-------------|-------------|-----------------|
| **Data Lake (ADLS)** | ~$0.02/GB/month | Minimal | Storage volume |
| **Warehouse (Synapse Dedicated)** | ~$30/TB/month | $5–10/DWU/hour | Always-on compute |
| **Lakehouse (Databricks)** | ~$0.02/GB/month | $0.07–0.55/DBU | Compute when running |
| **Snowflake** | ~$20/TB/month | $2–4/credit | Credits consumed |

**The expensive mistake:** Using a warehouse as your raw storage layer. Storing 1 PB in Synapse Dedicated costs 50x more than the same data in ADLS.

**The hidden cost:** Data duplication. Storing the same data in a lake AND a warehouse doubles storage and creates sync complexity.

---

## Common Architecture Mistakes

**Mistake 1: Using the warehouse for raw data**
```
Source → ADF → Synapse Dedicated (raw table)
Cost: $30/TB/month vs $0.02/TB/month in ADLS
Fix: Land raw in ADLS, only load modeled Gold to Synapse if needed
```

**Mistake 2: Running BI queries directly on Bronze**
```
Power BI → ADLS Bronze (raw JSON files)
Problem: No schema, no performance, no governance
Fix: Process Bronze → Silver (Delta) → Gold (star schema) → Power BI
```

**Mistake 3: Two sources of truth**
```
ADLS Silver and Synapse table both contain "customer" data
Result: They diverge, teams argue about which number is correct
Fix: One authoritative source (Gold Delta table), everything reads from it
```
