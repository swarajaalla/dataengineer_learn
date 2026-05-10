# Claude Instructions – Data Engineering Learning Website

## Project Overview

This is a personal website focused on **Data Engineering learning and portfolio**, built using:

* Docusaurus (TypeScript)
* Markdown-based content
* GitHub Pages for hosting

The website includes:

* Learning roadmap for beginners
* Real-world project case studies (Azure + Databricks)
* SQL / PySpark / ETL concepts
* Interview preparation content

---

## Core Principles

1. **Keep it simple**

   * Avoid overengineering
   * Prefer static content over dynamic logic
   * No unnecessary libraries

2. **Be practical, not theoretical**

   * Focus on real-world examples
   * Avoid generic textbook explanations

3. **Clarity over completeness**

   * Content should be easy to scan
   * Use headings, bullets, and examples

4. **No fluff**

   * Avoid motivational or vague content
   * Every section must add value

---

## Tech Stack Rules

* Use TypeScript (NOT JavaScript)
* Follow Docusaurus structure:

  * `/docs` → content
  * `/blog` → optional
  * `/src/pages` → custom pages
* Use Markdown (`.md` or `.mdx`) for content
* Avoid adding backend or APIs

---

## Content Guidelines

### Writing Style

* Short, crisp, and structured
* Use real examples (Azure, Databricks, ADF, Spark)
* Avoid long paragraphs

### Structure Example

Each topic should follow:

1. What is it (2–3 lines max)
2. Why it matters in real projects
3. Simple example
4. When to use / when NOT to use

---

## Key Sections to Support

Claude should help generate content for:

### 1. Roadmap

* Beginner → Intermediate → Advanced
* Focus on industry-relevant skills

### 2. Case Studies

case study 1 Example:
* SAP → Databricks → Unity Catalog migration
* Data ingestion frameworks using ADF
Structure:
* Problem
* Architecture
* Approach
* Challenges
* Outcome
case study 2 Example:
* Data quality framework build on DQX
Structure:
* Problem (why DQF is important)
* Architecture
* Approach
* Challenges
* Outcome

Will add more case studies 


### 3. Concepts

* SQL optimization
* Delta Lake
* Data modeling
* ETL patterns

### 4. Interview Prep

* Short Q&A format for each technology
* Scenario-based answers
* data engineering patterns

---

## UI / Design Rules

* Keep UI minimal and clean
* No heavy animations
* Prioritize readability over design

---

## Code Generation Rules

When generating code:

* Keep it minimal and working
* No unnecessary abstraction
* Add comments only where needed
* Follow existing project structure

---

## What to Avoid

* Do NOT introduce new frameworks
* Do NOT suggest backend systems
* Do NOT create overly complex components
* Do NOT generate generic blog-style content

---

## Expected Behavior from Claude

* Act like a **senior data engineer + practical builder**
* Give production-relevant examples
* Challenge unclear or vague requirements
* Prefer clarity over cleverness

---

## Example Prompt Usage

When I ask:
"Create a page for Delta Lake"

You should:

* Generate structured MDX content
* Include real-world examples
* Keep it concise and useful

---

## Important Context About Me

* 4+ years in Azure Data Engineering
* Strong in Databricks, ADF, Unity Catalog
* Built ingestion frameworks and migrations

Use this context to tailor examples.

---

## Goal

Help build a **high-quality, practical, no-fluff data engineering website**
that stands out and is useful for real learners and job seekers.

## project folder structure : 
docs/

├── intro.md
├── roadmap.md

├── phase-0-mindset/
│   ├── intro.md
│   ├── what-is-data-engineering.md
│   ├── roadmap-overview.md
│   ├── how-to-learn.md
│   └── setup/
│       ├── vscode.md
│       ├── git-github.md
│       ├── python-setup.md
│       └── databricks-community.md

├── phase-1-core-foundations/
│   │
│   ├── sql/
│   │   ├── basics.md
│   │   ├── joins.md
│   │   ├── window-functions.md
│   │   ├── cte-subqueries.md
│   │   ├── optimization.md
│   │   └── sql-for-databricks.md
│   │
│   ├── python/
│   │   ├── basics.md
│   │   ├── functions.md
│   │   ├── oop.md
│   │   ├── file-handling.md
│   │   ├── error-handling.md
│   │   └── pandas-basics.md
│   │
│   └── linux-git/
│       ├── linux-commands.md
│       ├── shell-scripting.md
│       ├── git-basics.md
│       └── branching-strategy.md

|──phase-2-data-engineering-core/
    |
    ├── intro.md
    |
    ├── 01-core-concepts/
    │   ├── what-is-data-engineering.md
    │   ├── big-data.md
    │   ├── types-of-data.md
    │   ├── databases-acid.md
    │   └── olap-vs-oltp.md
    |
    ├── 02-storage-systems/
    │   ├── data-warehouse.md
    │   ├── data-lake.md
    │   ├── lakehouse.md
    │   └── comparison.md
    |
    ├── 03-file-formats/
    │   ├── overview.md
    │   ├── csv.md
    │   ├── json.md
    │   ├── parquet.md
    │   ├── avro.md
    │   └── delta.md
    |
    ├── 04-data-ingestion/
    │   ├── overview.md
    │   ├── api-basics.md
    │   ├── ingestion-patterns.md
    │   ├── batch-ingestion.md
    │   ├── streaming-ingestion.md
    │   └── cdc.md
    |
    ├── 05-data-processing/
    │   ├── overview.md
    │   ├── etl-vs-elt.md
    │   ├── transformations.md
    │   ├── incremental-loads.md
    │   └── orchestration-basics.md
    |
    ├── 06-data-modeling/
    │   ├── overview.md
    │   ├── fact-dimension.md
    │   ├── star-schema.md
    │   ├── snowflake-schema.md
    │   ├── slowly-changing-dimensions.md
    │   └── medallion-architecture.md
    |
    ├── 07-streaming-and-events/
    │   ├── overview.md
    │   ├── batch-vs-streaming.md
    │   ├── event-driven-architecture.md
    │   ├── kafka-intro.md
    │   └── lambda-vs-kappa.md
    |
    └── 08-architecture-thinking/
        ├── overview.md
        ├── modern-data-stack.md
        ├── pipeline-design.md
        ├── data-flow-design.md
        └── real-world-architecture.md

├── phase-3-big-data-processing/
│   ├── spark/
│   │   ├── spark-basics.md
│   │   ├── spark-architecture.md
│   │   ├── transformations-actions.md
│   │   ├── spark-sql.md
│   │   ├── performance-tuning.md
│   │   ├── partitioning.md
│   │   ├── caching.md
│   │   └── joins-optimization.md
│   │
│   ├── delta-lake/
│   │   ├── delta-basics.md
│   │   ├── acid-transactions.md
│   │   ├── time-travel.md
│   │   ├── optimize-zorder.md
│   │   └── schema-evolution.md
│   │
│   ├── streaming/
│   │   ├── structured-streaming.md
│   │   ├── watermarks.md
│   │   ├── checkpoints.md
│   │   └── streaming-patterns.md
│   │
│   └── distributed-systems/
│       ├── partitioning.md
│       ├── shuffling.md
│       ├── fault-tolerance.md
│       └── scalability.md

├── phase-4-cloud-platforms/
│   ├── azure/
│   │   ├── storage.md
│   │   ├── adf.md
│   │   ├── synapse-analytics.md
|   |   ├── key-vault.md
│   │   ├── managed-identity.md
│   │   ├──log-analytics&monitoring.md
│   │   ├──connections-between-services.md
│   │   └── networking.md
│   │
│   ├── aws/
│   │   ├── s3.md
│   │   ├── glue.md
│   │   ├── emr.md
│   │   ├── redshift.md
│   │   └── iam.md
│   │
│   └── gcp/
│       ├── gcs.md
│       ├── bigquery.md
│       ├── dataproc.md
│       └── pubsub.md

├── phase-5-production-engineering/
│   ├── system_Design/
│   │   ├── design-trade-offs.md
│   │   ├── pipeline-patterns.md
│   │   ├── scalability-patterns.md
│   │   ├── system-design-scenarios.md
|   |
|   |── orchestration/
│   │   ├── airflow.md
│   │   ├── adf-orchestration.md
│   │   ├── dag-design.md
│   │   └── dependency-management.md
│   │
│   ├── ci-cd/
│   │   ├── cicd-basics.md
│   │   ├── azure-devops.md
│   │   ├── github-actions.md
│   │   ├── terraform-basics.md
│   │   └── deployment-strategy.md
│   │
│   ├── monitoring/
│   │   ├── logging.md
│   │   ├── alerting.md
│   │   ├── observability.md
│   │   └── cost-optimization.md
│   │
│   ├── security-governance/
│   │   ├── unity-catalog.md
│   │   ├── rbac.md
│   │   ├── data-lineage.md
│   │   └── secrets-management.md
│   │
│   └── databricks-deployment/
│       ├── repos.md
│       ├── workflows.md
│       ├── dbx.md
│       ├── asset-bundles.md
│       └── multi-env-deployment.md

├── phase-6-tools-platforms/
│   ├── databricks/
│   │   ├── workspace-overview.md
│   │   ├── unity-catalog.md
│   │   ├── delta-live-tables.md
│   │   ├── photon.md
│   │   └── sql-warehouse.md
│   │
│   ├── snowflake/
│   │   ├── architecture.md
│   │   ├── virtual-warehouses.md
│   │   ├── snowpipe.md
│   │   └── streams-tasks.md
│   │
│   ├── microsoft-fabric/
|   |
|   ├── cloudera/
│   │   ├── hdfs.md
│   │   ├── hive.md
│   │   ├── yarn.md
│   │   └── impala.md
│   │
│   └── kafka/
│       ├── brokers-topics.md
│       ├── partitions.md
│       ├── consumers.md
│       └── exactly-once.md

├── phase-7-real-projects/
│   ├── beginner-projects/
│   │   ├── csv-to-adls.md
│   │   ├── api-ingestion.md
│   │   └── sales-dashboard-pipeline.md
│   │
│   ├── intermediate-projects/
│   │   ├── kafka-streaming.md
│   │   ├── medallion-project.md
│   │   └── cicd-pipeline.md
│   │
│   └── case-studies/
│       ├── sap-to-databricks-unity-catalog.md
│       ├── hive-to-unity-catalog-migration.md
│       ├── adf-framework.md
│       └── dq-accelerator.md

├── phase-8-interviews-career/
│   ├── resume/
│   │   ├── resume-template.md
│   │   ├── project-writing.md
│   │   └── linkedin.md
│   │
│   ├── interview-prep/
│   │   ├── sql-questions.md
│   │   ├── spark-questions.md
│   │   ├── databricks-questions.md
│   │   ├── scenario-based.md
│   │   └── system-design.md
│   │
│   ├── certifications/
│   │   ├── dp203.md
│   │   ├── databricks-de.md
│   │   └── snowflake-cert.md
│   │
│   └── jobs/
│       ├── roadmap-to-job.md
│       ├── how-to-apply.md
│       ├── networking.md
│       └── salary-growth.md
│
└── resources/
    ├── cheatsheets.md
    ├── architecture-diagrams.md
    ├── ebooks.md
    └── youtube-playlists.md