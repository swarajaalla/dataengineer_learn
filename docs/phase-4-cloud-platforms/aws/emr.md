---
sidebar_position: 3
---

# Amazon EMR

EMR (Elastic MapReduce) is AWS's managed Spark cluster service. Use it when you need full control over your Spark environment — the AWS equivalent of Databricks clusters without the UI.

---

## What Is EMR?

EMR runs open-source frameworks (Spark, Hive, Presto) on EC2 clusters you configure. You control the cluster size, Spark version, and configuration.

**Two deployment modes:**
- **EMR on EC2** — traditional, you pick master + core + task nodes
- **EMR Serverless** — no cluster management, scales automatically (like Glue but more control)

---

## EMR Cluster Types

| Node Type | Role |
|-----------|------|
| **Master** | YARN ResourceManager, HDFS NameNode — 1 per cluster |
| **Core** | YARN NodeManager, HDFS DataNode — stores data, runs tasks |
| **Task** | YARN NodeManager only — no storage, can be Spot instances |

For data lake pipelines (S3 storage), use minimal Core nodes and scale with Task (Spot) nodes.

---

## Submit a Spark Job to EMR

```bash
# Add a Spark step to a running cluster
aws emr add-steps \
    --cluster-id j-XXXXXXXXXXXXX \
    --steps '[{
        "Name": "Transform Orders",
        "ActionOnFailure": "CONTINUE",
        "HadoopJarStep": {
            "Jar": "command-runner.jar",
            "Args": [
                "spark-submit",
                "--deploy-mode", "cluster",
                "--py-files", "s3://my-code-bucket/dependencies.zip",
                "s3://my-code-bucket/jobs/transform_orders.py",
                "--run_date", "2024-01-15",
                "--env", "prod"
            ]
        }
    }]'
```

---

## PySpark on EMR — Reading from S3

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date

spark = SparkSession.builder \
    .appName("TransformOrders") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Read from S3 (IAM role on cluster handles auth)
df = spark.read.parquet("s3://my-data-lake/bronze/orders/")

# Transform
df_clean = df \
    .filter(col("amount") > 0) \
    .withColumn("order_date", to_date(col("order_ts"))) \
    .dropDuplicates(["order_id"])

# Write Delta to S3
df_clean.write \
    .format("delta") \
    .mode("overwrite") \
    .save("s3://my-data-lake/silver/orders/")
```

---

## EMR Serverless — No Cluster Management

```python
# Submit a Spark job to EMR Serverless via boto3
import boto3

client = boto3.client('emr-serverless')

response = client.start_job_run(
    applicationId='<application-id>',
    executionRoleArn='arn:aws:iam::123456789:role/EMRServerlessRole',
    jobDriver={
        'sparkSubmit': {
            'entryPoint': 's3://my-code-bucket/jobs/transform_orders.py',
            'entryPointArguments': ['--run_date', '2024-01-15'],
            'sparkSubmitParameters': '--conf spark.executor.cores=4 --conf spark.executor.memory=8g'
        }
    }
)
```

---

## Cost Optimization

- Use **Spot Instances** for Task nodes — up to 90% cheaper (add to Core if jobs are fault-tolerant)
- Use **EMR Serverless** for intermittent workloads — pay only while running
- Use **S3 as storage** (not HDFS) — data persists after cluster termination
- Set auto-termination after job completes — never leave idle clusters running

---

## EMR vs Glue vs Databricks

| Factor | EMR | Glue | Databricks |
|--------|-----|------|-----------|
| Setup effort | High (cluster config) | Low (serverless) | Medium |
| Flexibility | Full control | Limited | High |
| Delta Lake | Requires config | Limited | Native |
| Cost for large jobs | Competitive (Spot) | Higher | Higher |
| Best for | Custom Spark, large batches | Simple ETL | Complex pipelines, ML |
