---
sidebar_position: 2
---

# AWS Glue

AWS Glue is the serverless ETL service on AWS — no cluster to provision. It's the AWS equivalent of Azure Data Factory + Databricks Spark, combined into a managed service.

---

## Core Components

| Component | Description |
|-----------|-------------|
| **Glue Data Catalog** | Centralized metadata store — table definitions, schemas |
| **Glue ETL Jobs** | Serverless Spark scripts — Python or Scala |
| **Glue Crawlers** | Auto-discover schema from S3 and register in Data Catalog |
| **Glue Studio** | Visual ETL builder (like ADF) |
| **Glue Triggers** | Schedule or event-based job execution |
| **Glue Workflows** | Chain multiple jobs with dependencies |

---

## Glue Data Catalog

The catalog is the central schema registry for your data lake. Other AWS services (Athena, EMR, Redshift) read from it.

```
Glue Data Catalog
    └── Database: silver
        └── Table: orders
            ├── Columns: order_id (int), customer_id (int), amount (double)
            ├── Location: s3://my-data-lake/silver/orders/
            └── Format: Parquet, partitioned by (year, month)
```

Once registered, query it in Athena without defining schema:

```sql
-- Athena uses Glue Catalog automatically
SELECT order_date, SUM(amount)
FROM silver.orders
WHERE year = '2024' AND month = '01'
GROUP BY order_date;
```

---

## Glue ETL Job (PySpark)

```python
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'run_date'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from Glue Catalog (Bronze)
bronze_df = glueContext.create_dynamic_frame.from_catalog(
    database="bronze",
    table_name="raw_orders"
).toDF()

# Transform
silver_df = bronze_df \
    .filter("amount > 0") \
    .filter("order_id IS NOT NULL") \
    .dropDuplicates(["order_id"])

# Write to S3 as Parquet
silver_df.write \
    .partitionBy("year", "month") \
    .mode("overwrite") \
    .parquet("s3://my-data-lake/silver/orders/")

job.commit()
```

---

## Crawlers — Auto Schema Discovery

Crawlers scan S3 and register table schemas in the Data Catalog:

```
Create Crawler:
  - Data source: s3://my-data-lake/bronze/orders/
  - IAM role: AWSGlueServiceRole
  - Target database: bronze
  - Schedule: On-demand or daily

Result:
  → Table "orders" created in "bronze" database
  → Schema auto-detected (column names, types, partitions)
  → Athena can now query it immediately
```

Run crawlers after every new data load to pick up schema changes.

---

## Glue vs Databricks on AWS

| Factor | Glue | Databricks |
|--------|------|-----------|
| Cluster management | Serverless (no config) | Managed clusters (more control) |
| Startup time | ~2-3 min cold start | ~3-5 min (job clusters) |
| Delta Lake support | Limited (via connector) | Native |
| Cost | Per DPU-hour | Per DBU |
| Use case | Simple ETL, catalog management | Complex Spark, ML, streaming |

---

## Best Practices

- Use Glue Catalog as the central schema registry even if you run jobs on EMR or Databricks
- Enable job bookmarks for incremental processing (Glue tracks last processed offset)
- Use Glue Workflows to chain dependent jobs instead of external schedulers
- Enable continuous logging to CloudWatch for debugging
