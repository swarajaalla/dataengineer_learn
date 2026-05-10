---
sidebar_position: 2
---

# Modern Data Stack

The Modern Data Stack (MDS) is a collection of cloud-native, SaaS-first tools that replaced traditional on-premise data warehousing. It's now the default starting point for new data platform builds.

---

## What It Is

The MDS is a set of best-of-breed, cloud-hosted tools assembled into a data platform:

```
Ingestion    →  Storage  →  Transformation  →  Serving     →  BI
(connectors)    (lake)       (dbt/Spark)        (warehouse)    (dashboards)
```

Each layer is a separate tool. You compose them rather than buying one monolithic system.

---

## The Canonical Modern Data Stack

**SaaS-first stack:**

| Layer | Tool | What it does |
|-------|------|-------------|
| **Ingestion** | Fivetran / Airbyte | Pre-built connectors to 300+ sources |
| **Storage** | S3 / ADLS | Object storage for raw and processed data |
| **Transformation** | dbt | SQL-based transformations inside the warehouse |
| **Warehouse / Serving** | Snowflake / BigQuery | Cloud data warehouse |
| **BI** | Looker / Metabase / Power BI | Dashboards and reporting |

---

## Azure Modern Data Stack

For Azure-native organizations:

```
ADF (ingestion)
     ↓
ADLS Gen2 (storage — Bronze, Silver, Gold)
     ↓
Databricks (transformation — PySpark, Delta Lake)
     ↓
Unity Catalog (governance — permissions, lineage, catalog)
     ↓
Power BI (BI — dashboards, reports)
```

Optionally:
- **Synapse Analytics** as the SQL warehouse for BI teams not using Databricks SQL
- **Purview** for metadata management and data catalog
- **Azure Monitor / Log Analytics** for pipeline observability

---

## Open Source Modern Data Stack

For teams wanting to avoid vendor lock-in:

```
Airbyte (ingestion) → S3 (storage) → dbt (transformation) → BigQuery (warehouse) → Metabase (BI)
```

Or fully open source:
```
Airbyte → MinIO (S3-compatible) → dbt + Spark → Apache Hive / Trino → Apache Superset
```

---

## Trade-offs of the Modern Data Stack

**Vendor lock-in:**
Using Fivetran + Snowflake + Looker = three separate vendor contracts. Migrating away from any one is painful. Fivetran's pricing scales with volume and can become expensive.

**Cost at scale:**
At small scale (< 1 TB), Snowflake + Fivetran is cheaper than building custom infrastructure. At large scale (> 100 TB), Databricks on ADLS is significantly cheaper than equivalent Snowflake compute.

**Operational overhead:**
SaaS tools are managed (no infrastructure to run). But you still need to manage dbt models, connector configurations, and warehouse optimization.

**Too many tools:**
Some organizations have Fivetran + ADF + Python scripts + Airbyte all doing ingestion. Tool sprawl creates maintenance overhead.

---

## Is the MDS Right for Every Company?

**Yes, start with MDS when:**
- Small team (< 5 DEs)
- Need to move fast
- Budget allows for SaaS tooling
- No specialized requirements

**Consider going custom when:**
- Volume is very high (> 100 TB/day)
- Source systems require custom connectors that SaaS tools don't support
- SaaS tool costs are prohibitive at scale
- Strong preference for open source
- Regulatory requirements restrict data leaving your cloud environment (SaaS tools often have their own cloud infrastructure)

---

## The Databricks + Azure Answer to MDS

For organizations already on Azure with Databricks investment:

```
ADF (free tier) → ADLS Gen2 ($0.02/GB) → Databricks (DBUs) → Unity Catalog (included) → Power BI (Microsoft license)
```

This avoids Fivetran (~$500–$2000+/month) and Snowflake compute costs. At > 10 TB/month of data, this stack is usually cheaper than a Fivetran + Snowflake approach — and more flexible for ML workloads.
