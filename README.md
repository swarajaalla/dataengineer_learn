# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### How to run application 
simple cmd : npm run start 

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

project folder structure : 
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
│   ├── fundamentals/
│   │   ├── data-warehouse.md
│   │   ├── database-basics.md
│   │   ├── olap-vs-oltp.md
│   │   ├── files-formats.md
│   │   └── api-basics.md
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

├── phase-2-data-engineering-core/
│   ├── etl-elt/
│   │   ├── etl-vs-elt.md
│   │   ├── ingestion-patterns.md
│   │   ├── cdc.md
│   │   ├── incremental-loads.md
│   │   └── orchestration-basics.md
│   │
│   ├── data-modeling/
│   │   ├── star-schema.md
│   │   ├── snowflake-schema.md
│   │   ├── fact-dimension.md
│   │   ├── slowly-changing-dimensions.md
│   │   └── medallion-architecture.md
│   │
│   ├── batch-vs-streaming/
│   │   ├── fundamentals.md
│   │   ├── kafka-intro.md
│   │   ├── event-driven-architecture.md
│   │   └── lambda-kappa.md
│   │
│   └── architecture/
│       ├── modern-data-stack.md
│       ├── lakehouse.md
│       ├── data-lake.md
│       ├── warehouse.md
│       └── pipeline-design.md

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
│   │   ├── adls.md
│   │   ├── adf.md
│   │   ├── synapse.md
│   │   ├── managed-identity.md
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
│   ├── orchestration/
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
│   ├── cloudera/
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