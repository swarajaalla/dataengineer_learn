---
sidebar_position: 2
---

# Tools & Technologies

All the tools a data engineer or data analyst needs to know. One-line purpose for each — no fluff.

---

## Data Engineering Tools

### Processing & Transformation

| Tool | Why It's Used |
|------|--------------|
| **Apache Spark** | Distributed processing engine for large-scale batch and streaming data |
| **Databricks** | Managed Spark platform with notebooks, workflows, and Unity Catalog governance |
| **dbt (data build tool)** | SQL-based transformation framework for building modular, tested data models |
| **Apache Flink** | Low-latency stateful stream processing for real-time pipelines |
| **Pandas** | In-memory data manipulation library for Python — used in exploratory work and small-scale ETL |
| **Polars** | Faster Pandas alternative written in Rust — useful for medium-scale local processing |

---

### Storage & Lakehouse

| Tool | Why It's Used |
|------|--------------|
| **Delta Lake** | Open-source storage layer adding ACID transactions and time travel to data lakes |
| **Apache Iceberg** | Alternative open table format for large analytic tables with schema evolution |
| **Apache Hudi** | Table format optimized for incremental upserts and near-real-time ingestion |
| **Parquet** | Columnar file format — the standard for storing large analytical datasets efficiently |
| **Avro** | Row-based serialization format used in Kafka and streaming pipelines |

---

### Data Warehouses

| Tool | Why It's Used |
|------|--------------|
| **Snowflake** | Cloud-native data warehouse with auto-scaling, zero-copy cloning, and built-in sharing |
| **Databricks SQL** | SQL analytics layer on top of Delta Lake — combines warehouse + lakehouse |
| **Azure Synapse Analytics** | Microsoft's unified analytics service combining data lake + SQL pool + Spark |
| **BigQuery** | Google's serverless data warehouse — pay per query, extremely fast on large datasets |
| **Amazon Redshift** | AWS column-store data warehouse — tight integration with S3 and AWS ecosystem |
| **DuckDB** | Embedded analytical database — run SQL on local files (Parquet, CSV) without a server |

---

### Orchestration & Pipelines

| Tool | Why It's Used |
|------|--------------|
| **Azure Data Factory (ADF)** | Microsoft's cloud ETL service — drag-and-drop pipelines with 90+ connectors |
| **Apache Airflow** | Python-based workflow orchestrator — define pipelines as DAGs with scheduling and monitoring |
| **Databricks Workflows** | Native Databricks job orchestrator for notebook and Spark workloads |
| **Prefect** | Modern Python orchestration framework with a simpler API than Airflow |
| **dbt Cloud** | Managed dbt with scheduling, CI/CD, lineage UI, and collaboration features |
| **Azure Event Hubs** | Real-time event ingestion service — compatible with Kafka protocol |
| **Apache Kafka** | Distributed message queue for high-throughput real-time event streaming |

---

### Data Quality & Governance

| Tool | Why It's Used |
|------|--------------|
| **Databricks DQX** | Open-source data quality framework for Databricks — rule-based validation |
| **Great Expectations** | Python library to define, document, and validate data quality expectations |
| **Unity Catalog** | Databricks' centralized governance layer for catalogs, lineage, and access control |
| **Apache Atlas** | Open-source data governance and metadata management for Hadoop ecosystems |
| **Monte Carlo** | Data observability platform — detects anomalies and freshness issues automatically |

---

### Ingestion & CDC

| Tool | Why It's Used |
|------|--------------|
| **Fivetran** | Managed ELT connectors — sync data from SaaS sources to your warehouse automatically |
| **Airbyte** | Open-source alternative to Fivetran — self-hosted or cloud, 300+ connectors |
| **Debezium** | CDC (Change Data Capture) tool — streams database changes as Kafka events |
| **Spark Structured Streaming** | Spark's API for processing live data streams with DataFrame semantics |
| **Azure Stream Analytics** | Real-time SQL-based stream processing on Azure with built-in connectors |

---

## Data Analysis Tools

### BI & Visualization

| Tool | Why It's Used |
|------|--------------|
| **Power BI** | Microsoft's BI tool — strong Azure integration, DAX for custom metrics, widely used in enterprise |
| **Tableau** | Drag-and-drop visual analytics — best for complex dashboards and storytelling |
| **Looker / Looker Studio** | Google's BI platform — LookML for data modeling, strong with BigQuery |
| **Metabase** | Open-source BI tool — easy to self-host, good for small-medium teams |
| **Superset** | Apache open-source BI — SQL-first, no-code charts, integrates with most databases |
| **Grafana** | Metrics and time-series visualization — used for pipeline monitoring, not business reporting |

---

### Analysis & Notebooks

| Tool | Why It's Used |
|------|--------------|
| **Jupyter Notebook** | Interactive Python environment for exploratory analysis and prototyping |
| **Databricks Notebooks** | Collaborative notebooks that run at Spark scale — standard in enterprise DE teams |
| **Google Colab** | Free Jupyter environment in the browser — good for learning and prototyping |
| **VS Code** | Primary IDE for writing Python, SQL, dbt models, and managing pipelines |

---

## Programming Languages

| Language | Why It's Used |
|----------|--------------|
| **Python** | Primary language for data engineering — pipelines, transformations, scripting, ML |
| **SQL** | Most-used language in data work — querying, transformations, analytics |
| **Scala** | Native language of Spark — used for performance-critical Spark jobs |
| **PySpark** | Python API for Apache Spark — used in 90% of Spark jobs in industry |
| **Bash / Shell** | Scripting for automation, cron jobs, file operations, and deployment tasks |
| **YAML** | Configuration language — used in Airflow DAGs, GitHub Actions, dbt, and ADF |
| **HCL (Terraform)** | Infrastructure as Code — provision cloud resources (storage, compute, networking) |
| **TypeScript / JavaScript** | Rarely used in DE — occasionally for custom Docusaurus or frontend dashboards |

---

## Version Control & DevOps

| Tool | Why It's Used |
|------|--------------|
| **Git** | Source control — standard for all code including notebooks, SQL, and pipelines |
| **GitHub / Azure DevOps** | Hosting, CI/CD pipelines, pull request workflows, and deployment automation |
| **Docker** | Containerize pipeline code and services for consistent environments |
| **Terraform** | Provision cloud infrastructure (storage accounts, clusters, ADF) as code |
| **GitHub Actions** | CI/CD — run tests, lint, and deploy pipelines on code push |

---

## Quick Skill Priority Guide

### Data Engineer — Must Know
`SQL` · `Python` · `Spark / PySpark` · `Delta Lake` · `ADF or Airflow` · `Azure / AWS` · `Git`

### Data Analyst — Must Know
`SQL` · `Power BI or Tableau` · `Python or Excel` · `DAX` · `Basic cloud storage`

### Both Roles — Helpful
`dbt` · `Databricks` · `Git` · `Data modeling` · `Snowflake`
