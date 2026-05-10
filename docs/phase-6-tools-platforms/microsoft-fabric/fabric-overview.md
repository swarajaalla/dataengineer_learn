---
sidebar_position: 1
---

# Microsoft Fabric — Overview

Microsoft Fabric is an all-in-one analytics platform launched in 2023. It unifies data engineering, data warehousing, real-time analytics, data science, and Power BI under one SaaS product with a single billing unit — **Capacity Units (CU)**.

---

## What Is Fabric?

Fabric is Microsoft's answer to the fragmented Azure data stack. Instead of wiring together ADLS + ADF + Databricks + Synapse + Power BI manually, Fabric provides all of these as integrated experiences inside one workspace.

```
Microsoft Fabric
    ├── Data Factory          → Pipeline orchestration (ADF-equivalent)
    ├── Data Engineering      → Spark notebooks + Lakehouse
    ├── Data Warehouse        → SQL-based DWH (Synapse-equivalent)
    ├── Real-Time Intelligence → Event streams + KQL (Kusto)
    ├── Data Science          → ML experiments + notebooks
    ├── Data Activator        → Trigger actions on data conditions
    └── Power BI              → Reporting, natively embedded
```

All workloads share one storage layer: **OneLake**.

---

## OneLake — The Core Storage Layer

OneLake is Fabric's unified data lake — one lake per tenant, all workloads read/write from the same place.

```
OneLake (one per organisation)
    └── Workspace A
        ├── Lakehouse: sales_lakehouse
        │       ├── Tables/     ← Delta format, managed
        │       └── Files/      ← Raw files (CSV, Parquet, JSON)
        └── Workspace B
            └── Lakehouse: finance_lakehouse
                    └── Tables/
```

**Key property:** A Warehouse and a Lakehouse in the same workspace both see the same OneLake data — no copying.

**OneLake shortcut:** Reference data in ADLS Gen2, S3, or GCS without copying it into Fabric. The data stays where it is; Fabric reads it transparently.

```
OneLake Shortcut → points to → s3://my-bucket/silver/orders/
Fabric sees it as a native table — no data movement
```

---

## Fabric vs Azure Data Stack

| Fabric Component | Azure Equivalent | Key Difference |
|------------------|-----------------|----------------|
| Lakehouse | ADLS Gen2 + Databricks | Delta tables + SQL endpoint included automatically |
| Data Warehouse | Synapse Dedicated Pool | Serverless, no DWU to configure |
| Data Factory | Azure Data Factory | Same UI, same connectors |
| Real-Time Intelligence | Event Hub + Stream Analytics | Unified in one UI |
| Power BI | Power BI Premium | Embedded, no separate license |
| OneLake | ADLS Gen2 | Tenant-wide, not per-workspace |

---

## Licensing — Capacity Units (CU)

Fabric is billed by **Capacity** — a pool of compute bought at the workspace level. All workloads (Spark, SQL, Power BI) draw from the same CU pool.

| SKU | CU | Approx Monthly Cost | Use Case |
|-----|----|---------------------|----------|
| F2 | 2 | ~$262 | Dev/test |
| F4 | 4 | ~$524 | Small team |
| F8 | 8 | ~$1,048 | Medium workloads |
| F64 | 64 | ~$8,384 | Enterprise |

**Pay-as-you-go** also available — pause capacity when not in use.

---

## Who Should Use Fabric?

**Good fit:**
- Teams already on Microsoft 365 / Azure with Power BI Premium
- Orgs wanting to reduce the number of separate services to manage
- Teams that want Lakehouse + SQL warehouse + Power BI under one billing

**Not ideal (yet) for:**
- Complex ML workloads (Databricks MLflow is more mature)
- Multi-cloud strategies (Fabric is Microsoft-only)
- Teams needing fine-grained Unity Catalog-style governance (Purview integration is still maturing)
