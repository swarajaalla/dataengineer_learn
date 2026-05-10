---
sidebar_position: 1
---

# Google Cloud Storage (GCS)

GCS is Google's object storage service — the data lake foundation on GCP, equivalent to S3 on AWS or ADLS on Azure.

---

## What Is GCS?

GCS stores objects (files) in buckets. Like S3, it has a flat namespace with `/` prefix-based "folders." It's the default landing zone for all GCP data pipelines.

```
gs://my-data-lake/
├── bronze/
│   └── orders/dt=2024-01-15/
│       └── part-00000.parquet
├── silver/
│   └── orders/
└── gold/
    └── fact_sales/
```

**GCS URI format:** `gs://bucket-name/prefix/path/`

---

## Storage Classes

| Class | Use Case | Retrieval Cost |
|-------|----------|----------------|
| **Standard** | Active data, Silver + Gold | None |
| **Nearline** | Accessed < once/month (Bronze archive) | Per GB |
| **Coldline** | Accessed < once/quarter | Per GB |
| **Archive** | Long-term compliance | Per GB |

Use lifecycle rules to auto-transition Bronze data from Standard → Nearline → Archive.

---

## Reading GCS from Spark (Dataproc)

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("TransformOrders").getOrCreate()

# Read Parquet from GCS (service account on cluster handles auth)
df = spark.read.parquet("gs://my-data-lake/bronze/orders/")

# Read Delta table
df = spark.read.format("delta").load("gs://my-data-lake/silver/orders/")

# Write partitioned data
df.write \
    .partitionBy("dt") \
    .mode("overwrite") \
    .parquet("gs://my-data-lake/silver/orders/")
```

---

## IAM & Access Control

GCS uses IAM roles — assign to service accounts (not users) for service-to-service access:

```bash
# Grant Dataproc service account access to GCS bucket
gcloud storage buckets add-iam-policy-binding gs://my-data-lake \
    --member="serviceAccount:dataproc-sa@my-project.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# List buckets
gcloud storage ls gs://my-data-lake/bronze/

# Copy files
gcloud storage cp gs://source-bucket/file.parquet gs://dest-bucket/
```

---

## Lifecycle Rules

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 30, "matchesPrefix": ["bronze/"]}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
        "condition": {"age": 365, "matchesPrefix": ["bronze/"]}
      }
    ]
  }
}
```

---

## GCS vs S3 vs ADLS

| Feature | GCS | S3 | ADLS Gen2 |
|---------|-----|----|-----------|
| Namespace | Flat | Flat | Hierarchical |
| Strong consistency | Yes (since 2021) | Yes | Yes |
| Native integration | BigQuery, Dataproc | EMR, Glue, Athena | ADF, Databricks, Synapse |
| Lifecycle rules | Yes | Yes | Yes |
| Max object size | 5 TB | 5 TB | 4.77 TB |

---

## Best Practices

- Create separate buckets for Bronze, Silver, Gold (not just prefixes — simplifies IAM)
- Enable **uniform bucket-level access** — disables per-object ACLs, cleaner IAM
- Use **Workload Identity** for GKE workloads to access GCS without service account keys
- Enable **Object Versioning** on Silver and Gold for recovery from bad writes
- Use **Pub/Sub notifications** on GCS bucket events to trigger downstream pipelines
