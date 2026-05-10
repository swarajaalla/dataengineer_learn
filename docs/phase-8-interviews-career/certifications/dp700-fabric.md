---
sidebar_position: 2
---

# DP-700: Microsoft Fabric Data Engineer Associate

Microsoft's newest data engineering certification (launched 2024), focused entirely on Microsoft Fabric. If you work with Fabric or plan to, this is the most relevant cert to pursue after DP-203.

---

## What It Covers

| Domain | Weight |
|--------|--------|
| Implement and manage a Microsoft Fabric analytics solution | 100% |

**Core topic areas:**

- OneLake — shortcuts, security, external access
- Lakehouse — creating, loading data via notebooks, SQL endpoint
- Data Warehouse in Fabric — tables, views, SQL DML
- Data Factory (Fabric) — pipelines, Dataflow Gen2, Copy activity
- Real-Time Intelligence — Eventstreams, KQL databases, Kusto queries
- Data Science — notebooks, experiments, ML models in Fabric
- Power BI semantic models — creating and managing in Fabric
- Security — workspace roles, item-level permissions, row-level security

---

## DP-700 vs DP-203

| | DP-203 | DP-700 |
|--|--------|--------|
| Focus | Azure data services (ADF, Synapse, ADLS) | Microsoft Fabric only |
| Launched | 2021 | 2024 |
| Relevance | Existing Azure DE stacks | New Fabric-first projects |
| Difficulty | Medium–High | Medium |
| Recommended order | First | After DP-203 or if Fabric is primary tool |

Both are worth having if your org uses Azure. DP-203 shows breadth; DP-700 shows Fabric depth.

---

## Exam Format

- Duration: 100 minutes
- Questions: 40–60 (multiple choice, drag-and-drop, case studies)
- Passing score: 700/1000
- Cost: ~$165 USD
- Valid for: 1 year (free online renewal)

---

## Study Resources

| Resource | Cost | Notes |
|----------|------|-------|
| Microsoft Learn — DP-700 path | Free | Official, hands-on with Fabric trial |
| Microsoft Fabric free trial | Free (60 days) | Hands-on labs are essential |
| Alan Gifford's DP-700 course (Udemy) | ~$15 | Structured video walkthrough |
| Microsoft official practice assessment | Free | On the exam page — do this first |

**Get a Fabric trial:** Go to app.fabric.microsoft.com → start a 60-day free trial. Build a Lakehouse, a pipeline, and a simple report. Hands-on time is more valuable than any video course for this exam.

---

## Key Topics to Focus On

**High weight, often tested:**
- Lakehouse vs Warehouse — which to use for which scenario
- OneLake shortcuts — how to create, what sources are supported
- Dataflow Gen2 — Power Query transforms, output to Lakehouse
- Fabric pipelines — Copy Data activity, parameterization, triggers
- KQL basics — query syntax for Real-Time Intelligence
- Workspace roles — Admin, Member, Contributor, Viewer — what each can do

**Commonly missed:**
- Difference between a managed and external Delta table in Fabric
- Default semantic model — what it is, when it's auto-created
- Eventstream vs Event Hub — when Fabric Eventstream wraps Event Hub
- Direct Lake mode in Power BI — how it differs from Import and DirectQuery

---

## Sample Questions

**Q: You need to query ADLS Gen2 data from Fabric without copying it. What do you use?**  
A: A OneLake shortcut pointing to the ADLS Gen2 path. No data movement — Fabric reads from ADLS directly.

**Q: A business analyst needs to build transforms on data in a Fabric Lakehouse without writing code. What do you use?**  
A: Dataflow Gen2 — Power Query-based visual ETL that writes output to the Lakehouse.

**Q: What is the difference between a Fabric Lakehouse and a Fabric Data Warehouse?**  
A: A Lakehouse uses Delta format and supports both Spark (read/write) and SQL endpoint (read-only). A Warehouse uses Fabric's proprietary format, supports SQL DML (INSERT, UPDATE, DELETE), and is optimised for structured analytical workloads.
