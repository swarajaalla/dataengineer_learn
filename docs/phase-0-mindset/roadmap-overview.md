---
sidebar_position: 2
---

# Roadmap Overview

A realistic learning path from zero to production-ready data engineer.

---

## Time Estimates (Realistic, Not Optimistic)

| Phase | Topics | Time (part-time) |
|-------|--------|------------------|
| 0 – Mindset & Setup | Tools, mindset | 1 week |
| 1 – Core Foundations | SQL, Python, fundamentals | 6–8 weeks |
| 2 – DE Core | ETL, data modeling, streaming | 6–8 weeks |
| 3 – Big Data | Spark, Delta Lake | 6–8 weeks |
| 4 – Cloud | Azure/AWS/GCP services | 4–6 weeks |
| 5 – Production | Orchestration, CI/CD, monitoring | 4–6 weeks |
| 6 – Tools | Databricks, Snowflake, Kafka | 4–6 weeks |
| 7 – Projects | 2–3 end-to-end pipelines | 6–8 weeks |
| 8 – Interviews | SQL prep, system design | 3–4 weeks |

Total: ~9–12 months for a complete, job-ready foundation.

---

## Learning Order (Non-Negotiable)

```
1. SQL (window functions, joins, CTEs)
2. Python (data manipulation, APIs, error handling)
3. Fundamentals (formats, lakehouse, medallion)
4. ETL patterns (incremental, MERGE, SCD)
5. Spark + Delta Lake
6. Cloud (Azure first)
7. Orchestration (ADF or Airflow)
8. Real project
9. Interview prep
```

Don't skip SQL. Even in Spark and Databricks, SQL is used constantly.  
Don't skip Python. ADF has limits — Python is needed for custom logic.

---

## Entry Points Based on Background

### No Tech Background
Start at Phase 0. Take time at SQL and Python. Don't rush.

### Software Developer
You can skip setup basics. Focus on SQL depth and ETL patterns — they're different from app development logic.

### Data Analyst (knows SQL + BI tools)
Start at Phase 2. You know the output (reports). Now learn how the pipelines that feed them work.

### Junior Data Engineer (done tutorials, needs real skills)
Skip to Phase 3 (Spark + Delta). Then Phase 5 (CI/CD, production patterns). Build a real project.

---

## What To Build at Each Stage

| After Phase | Project |
|-------------|---------|
| Phase 1 | SQL + Python scripts that clean and transform a dataset |
| Phase 2 | End-to-end ELT: API → ADLS → dbt models |
| Phase 3 | Spark notebook: Bronze → Silver → Gold in Databricks |
| Phase 4 | Deploy pipeline to Azure, secured with Managed Identity |
| Phase 5 | Full CI/CD pipeline with tests, GitHub Actions, and Databricks deployment |
| Phase 7 | Portfolio project — end-to-end with documentation |

---

## Signs You're Ready for a Job

- You can design a data pipeline from scratch (source → serving)
- You can explain trade-offs (batch vs streaming, full vs incremental load)
- You can write complex SQL and optimize a slow query
- You have a public GitHub repo with a real project
- You can answer "how would you handle late-arriving data?" without hesitation
