---
sidebar_position: 3
---

# Cloud Platforms

A focused reference for data engineers on the three major cloud providers. Shows only services relevant to data workloads.

---

## Microsoft Azure

The most common cloud for enterprise data engineering in EMEA and large enterprises globally. Strong integration between ADF, Databricks, and Power BI.

### Core Data Services

| Service | Category | Why It's Used |
|---------|----------|--------------|
| **Azure Data Factory (ADF)** | Orchestration / ETL | Cloud ETL service — 90+ connectors, parameterized pipelines, no-code + code |
| **Azure Data Lake Storage Gen2 (ADLS)** | Storage | Scalable blob storage with hierarchical namespace — primary landing zone for raw data |
| **Azure Databricks** | Processing | Fully managed Spark + Delta Lake platform — notebooks, clusters, Unity Catalog |
| **Azure Synapse Analytics** | Analytics | Unified workspace combining SQL Pool (warehouse), Spark, and pipelines |
| **Azure SQL Database** | Relational DB | Managed SQL Server in the cloud — used for operational data and pipeline metadata |
| **Azure Cosmos DB** | NoSQL | Multi-model NoSQL database — low-latency reads, globally distributed |
| **Azure Event Hubs** | Streaming Ingest | Real-time event ingestion — compatible with Kafka protocol |
| **Azure Stream Analytics** | Stream Processing | Serverless SQL-based stream processing on Event Hubs / IoT Hub |
| **Power BI** | Visualization | Microsoft's BI tool — embedded in Azure, tight ADF and Synapse integration |
| **Azure Purview (Microsoft Purview)** | Governance | Data catalog and lineage tool — scan and classify data across sources |

### Infrastructure & DevOps

| Service | Why It's Used |
|---------|--------------|
| **Azure DevOps** | CI/CD pipelines, Git repos, release management for data projects |
| **Azure Key Vault** | Secure storage of secrets, connection strings, and API keys |
| **Azure Monitor / Log Analytics** | Pipeline monitoring, alerting, and log aggregation |
| **Azure Container Registry** | Store Docker images for containerized Spark jobs or pipeline code |
| **Azure Active Directory (Entra ID)** | Identity and access management — controls who accesses what data |

### Typical Azure Data Stack (Enterprise)

```
Sources → ADF (ingest) → ADLS Gen2 (raw/bronze)
        → Databricks (transform: silver/gold)
        → Unity Catalog (governance)
        → Power BI (reporting)
```

---

## Amazon Web Services (AWS)

The largest cloud by market share. Dominant in startups and US-based companies. Deep ecosystem with many specialized services.

### Core Data Services

| Service | Category | Why It's Used |
|---------|----------|--------------|
| **Amazon S3** | Storage | Object storage — the standard data lake foundation on AWS |
| **AWS Glue** | ETL / Catalog | Serverless Spark-based ETL + data catalog (Glue Catalog used by Athena/EMR) |
| **Amazon EMR** | Processing | Managed Spark/Hadoop clusters — for large-scale batch processing |
| **Amazon Redshift** | Data Warehouse | Columnar warehouse — optimized for complex analytical queries on large datasets |
| **AWS Lake Formation** | Governance | Centralized access control and data catalog for S3-based data lakes |
| **Amazon Athena** | Query Engine | Serverless SQL on S3 — query Parquet/CSV files without loading into a warehouse |
| **Amazon Kinesis** | Streaming | Real-time data streaming — Kinesis Data Streams + Firehose for delivery |
| **Amazon RDS / Aurora** | Relational DB | Managed relational databases (PostgreSQL, MySQL) — operational data sources |
| **Amazon DynamoDB** | NoSQL | Serverless key-value + document database — high-throughput operational workloads |
| **Amazon QuickSight** | Visualization | AWS-native BI tool — ML-powered insights, tight S3/Redshift integration |
| **AWS Step Functions** | Orchestration | Serverless workflow orchestration — coordinate Lambda, Glue, and other AWS services |
| **Amazon MWAA** | Orchestration | Managed Apache Airflow — run Airflow DAGs without managing infrastructure |

### Typical AWS Data Stack (Modern)

```
Sources → S3 (raw) → Glue / EMR (transform)
        → Redshift or Athena (analytics)
        → QuickSight or Tableau (reporting)
```

---

## Google Cloud Platform (GCP)

Known for its analytics-first services. BigQuery is the best serverless data warehouse available. Strong in media, retail, and data science-heavy teams.

### Core Data Services

| Service | Category | Why It's Used |
|---------|----------|--------------|
| **BigQuery** | Data Warehouse | Serverless columnar warehouse — no infrastructure, pay per query, petabyte scale |
| **Google Cloud Storage (GCS)** | Storage | Object storage — equivalent to S3, used as data lake landing zone |
| **Dataflow** | Stream + Batch Processing | Managed Apache Beam pipelines — both batch and streaming with autoscaling |
| **Dataproc** | Processing | Managed Spark/Hadoop clusters on GCP — similar to AWS EMR |
| **Pub/Sub** | Streaming Ingest | Real-time message queue — equivalent to Kafka or Kinesis on GCP |
| **Cloud Composer** | Orchestration | Managed Apache Airflow on GCP — schedule and monitor data pipelines |
| **Looker / Looker Studio** | Visualization | Google's BI platform — LookML data modeling, deep BigQuery integration |
| **Vertex AI** | ML Platform | Managed ML/AI platform — build, train, and deploy models at scale |
| **Cloud Spanner** | Relational DB | Globally distributed relational database — strong consistency at scale |
| **Dataplex** | Governance | Unified data management — catalog, quality, and governance across GCS and BigQuery |
| **dbt + BigQuery** | Transformation | Most popular dbt target — large community and native BigQuery optimizations |

### Typical GCP Data Stack

```
Sources → Pub/Sub → Dataflow (stream) or Dataproc (batch)
        → GCS (raw) → BigQuery (transform + analytics)
        → Looker / Looker Studio (reporting)
```

---

## Side-by-Side Comparison

| Capability | Azure | AWS | GCP |
|-----------|-------|-----|-----|
| **Data Lake** | ADLS Gen2 | S3 | GCS |
| **Warehouse** | Synapse / Databricks SQL | Redshift | BigQuery |
| **ETL / Pipelines** | ADF | Glue | Dataflow |
| **Spark** | Databricks / Synapse | EMR | Dataproc |
| **Orchestration** | ADF / MWAA | MWAA / Step Functions | Cloud Composer |
| **Streaming** | Event Hubs | Kinesis | Pub/Sub |
| **Governance** | Purview / Unity Catalog | Lake Formation | Dataplex |
| **BI** | Power BI | QuickSight | Looker |
| **Serverless SQL** | Synapse Serverless | Athena | BigQuery |

---

## Which Cloud Should You Learn First?

| If you're targeting... | Focus on |
|------------------------|----------|
| Enterprise / corporate jobs (EMEA) | **Azure** |
| Startups and US tech companies | **AWS** |
| Data science + analytics-heavy teams | **GCP** |
| Maximum job options | **Azure first, then AWS** |

Azure is the most common in enterprise data engineering roles. Learn it well before branching to others.
