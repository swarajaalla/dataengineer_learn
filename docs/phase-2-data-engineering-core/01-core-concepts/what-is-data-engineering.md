---
sidebar_position: 1
---

# What Is Data Engineering?

Data engineering is the discipline of building and maintaining the systems that move, store, and transform data so that analysts, data scientists, and business users can rely on it.

---

## What Data Engineers Actually Do

Not "build ML models" and not "write SQL reports." The job is plumbing:

- **Build pipelines** — move data from source systems (SAP, Salesforce, APIs) to analytical stores (ADLS, Databricks, Snowflake)
- **Transform data** — clean, validate, join, aggregate raw data into usable form
- **Ensure reliability** — pipelines that fail silently are worse than no pipeline
- **Manage infrastructure** — clusters, storage, orchestration, monitoring
- **Enable downstream users** — data scientists and analysts can't work without clean, documented data

---

## DE vs Data Scientist vs Data Analyst

| Role | Primary Output | Tools | Skills |
|------|---------------|-------|--------|
| **Data Engineer** | Pipelines, data products | Spark, ADF, Databricks, SQL | Python, distributed systems, cloud infra |
| **Data Scientist** | Models, predictions | Python, notebooks, ML frameworks | Statistics, ML, experimentation |
| **Data Analyst** | Reports, dashboards | SQL, Power BI, Tableau | Business logic, SQL, visualization |

Data engineers build the roads. Data scientists and analysts drive on them.

---

## Core Skills

**Must have:**
- SQL — complex queries, optimization, window functions
- Python — scripting, pipeline code, API calls
- Spark / PySpark — distributed processing at scale
- Cloud platform — Azure (ADF, ADLS, Databricks), AWS (Glue, S3, EMR), or GCP (BigQuery, Dataflow)
- Orchestration — ADF pipelines, Airflow, Databricks Workflows

**Good to have:**
- Delta Lake / lakehouse concepts
- Streaming (Kafka, Event Hubs, Structured Streaming)
- Infrastructure as Code (Terraform, ARM templates)
- CI/CD (Azure DevOps, GitHub Actions)
- Data governance (Unity Catalog, Purview)

---

## A Typical Day

```
09:00  Pipeline alerts triggered overnight — check ADF monitoring logs
09:30  Investigate: source file arrived 2 hours late, downstream jobs skipped
10:00  Fix trigger dependency, re-run affected pipelines
11:00  New requirement: ingest SAP table with 50M rows daily
11:30  Design ingestion approach: watermark-based incremental vs full load
14:00  Implement ADF Copy Activity + Databricks Silver notebook
16:00  PR review for teammate's CDC pipeline code
17:00  Unity Catalog permissions request from analytics team
```

---

## Career Path

```
Junior DE (0–2 yrs)
  → Implements pipelines under guidance
  → Learns cloud tools, SQL, basic Spark
  
Mid-level DE (2–4 yrs)
  → Owns pipelines end-to-end
  → Designs ingestion frameworks
  → Handles incidents independently
  
Senior DE (4–7 yrs)
  → Architects multi-source pipelines
  → Mentors, sets standards
  → Works closely with platform teams
  
Lead / Principal DE (7+ yrs)
  → Org-wide data architecture decisions
  → Cross-team roadmap ownership
  → Tech strategy, vendor evaluation

Data Architect
  → No code, all design
  → Governance, patterns, standards
```

---

## What Makes a Good Data Engineer

- **Thinks about failure first** — what happens when the source changes schema? When the API is down?
- **Obsessed with reliability** — a dashboard that's wrong is worse than no dashboard
- **Understands the business** — knowing WHY data is needed makes better pipelines
- **Comfortable with ambiguity** — source systems are messy, requirements change
