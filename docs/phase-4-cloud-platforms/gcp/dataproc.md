---
sidebar_position: 3
---

# Google Cloud Dataproc

Dataproc is GCP's managed Spark (and Hadoop) service — the GCP equivalent of EMR on AWS or Databricks clusters. Use it when you need a Spark environment on GCP without the management overhead of self-hosted clusters.

---

## What Is Dataproc?

Dataproc provisions Spark clusters on GCP in ~90 seconds. It manages installation, configuration, and integration with GCP services (GCS, BigQuery, Pub/Sub).

**Two modes:**
- **Dataproc Clusters** — long-running or ephemeral clusters you manage
- **Dataproc Serverless** — no cluster to provision, auto-scales, pay per job

---

## Create and Use a Cluster

```bash
# Create an ephemeral Spark cluster
gcloud dataproc clusters create my-spark-cluster \
    --region=europe-west2 \
    --num-workers=4 \
    --worker-machine-type=n1-standard-4 \
    --image-version=2.1-debian11 \
    --properties=spark:spark.sql.extensions=io.delta.sql.DeltaSparkSessionExtension \
    --initialization-actions=gs://my-bucket/init-scripts/install-delta.sh

# Submit a PySpark job
gcloud dataproc jobs submit pyspark \
    gs://my-code-bucket/jobs/transform_orders.py \
    --cluster=my-spark-cluster \
    --region=europe-west2 \
    -- --run_date=2024-01-15 --env=prod

# Delete cluster after job (ephemeral pattern)
gcloud dataproc clusters delete my-spark-cluster --region=europe-west2
```

---

## PySpark on Dataproc — Reading from GCS

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date, current_timestamp

spark = SparkSession.builder \
    .appName("TransformOrders") \
    .getOrCreate()

# GCS access is automatic via Dataproc service account
df = spark.read.parquet("gs://my-data-lake/bronze/orders/")

df_clean = df \
    .filter(col("amount") > 0) \
    .filter(col("order_id").isNotNull()) \
    .withColumn("order_date", to_date(col("order_ts"))) \
    .withColumn("_processed_ts", current_timestamp())

# Write to GCS
df_clean.write \
    .partitionBy("order_date") \
    .mode("overwrite") \
    .parquet("gs://my-data-lake/silver/orders/")

# Write directly to BigQuery
df_clean.write \
    .format("bigquery") \
    .option("table", "my-project.silver.orders") \
    .mode("append") \
    .save()
```

---

## Dataproc Serverless — No Cluster Management

```bash
# Submit a serverless Spark batch job
gcloud dataproc batches submit pyspark \
    gs://my-code-bucket/jobs/transform_orders.py \
    --region=europe-west2 \
    --service-account=dataproc-sa@my-project.iam.gserviceaccount.com \
    --subnet=projects/my-project/regions/europe-west2/subnetworks/default \
    -- --run_date=2024-01-15
```

Serverless scales executors automatically — ideal for intermittent batch jobs.

---

## Dataproc vs Alternatives on GCP

| Factor | Dataproc | Dataproc Serverless | Databricks on GCP |
|--------|----------|---------------------|-------------------|
| Cluster management | Yes | No | Managed |
| Spark flexibility | Full | Limited config | Full |
| Delta Lake support | Via init script | Via JAR | Native |
| Cost for short jobs | Higher (cluster overhead) | Lower (per-job) | Higher (DBU) |
| Startup time | ~90 seconds | ~2 min | ~3-5 min |
| Best for | Large scheduled batches | Ad-hoc Spark jobs | Complex pipelines, ML |

---

## Ephemeral Cluster Pattern (Best Practice)

Don't keep clusters running — create → run → delete:

```bash
# In Cloud Composer (Airflow) DAG
create_cluster >> submit_job >> delete_cluster
```

Benefits:
- No idle cluster costs
- Clean environment every run
- Latest patches automatically applied

---

## Integration with BigQuery

Dataproc integrates natively with BigQuery via the BigQuery Spark connector:

```python
# Write Spark DataFrame directly to BigQuery
df.write \
    .format("bigquery") \
    .option("table", "my-project.gold.fact_sales") \
    .option("temporaryGcsBucket", "my-temp-bucket") \
    .mode("overwrite") \
    .save()

# Read BigQuery table into Spark
df = spark.read \
    .format("bigquery") \
    .option("table", "my-project.gold.dim_customers") \
    .load()
```
