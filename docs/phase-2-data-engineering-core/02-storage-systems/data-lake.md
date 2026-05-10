---
sidebar_position: 2
---

# Data Lake

A data lake is a central repository that stores all data — structured, semi-structured, and unstructured — in its raw, native format. No transformation required before landing.

---

## Why Data Lakes Exist

Before data lakes, getting data into a warehouse required upfront schema design and ETL processing. This created problems:
- **Slow time-to-value** — data couldn't be used until modeled
- **Siloed data** — each team had their own extracts
- **Lost raw data** — if transformation logic was wrong, you had to re-extract from source
- **High cost** — warehouse compute is expensive; raw storage is cheap

Data lakes solved this by storing everything first, asking questions later.

---

## What a Data Lake Is

```
Object storage (ADLS Gen2 / S3 / GCS)
+ Any file format (CSV, JSON, Parquet, Avro, images, audio)
+ Any schema (or no schema)
+ Any data source (databases, APIs, streams, files)
+ Cheap storage ($0.02–$0.06 per GB/month)
```

No schema enforced at write time. Schema is applied at read time ("schema on read").

---

## ADLS Gen2 Architecture

Azure Data Lake Storage Gen2 is the Azure data lake. It's Azure Blob Storage with Hierarchical Namespace (HNS) enabled.

```
Storage Account
  └── Container (equivalent to S3 bucket)
      ├── bronze/
      │   ├── sap/
      │   │   └── sales_orders/
      │   │       └── year=2024/month=01/day=15/
      │   │           └── part-00000.parquet
      │   └── salesforce/
      │       └── contacts/
      └── silver/
          └── sap_sales_orders/
              └── year=2024/month=01/
                  └── part-00000.parquet (Delta format)
```

**Why HNS matters:** Without it, deleting a "folder" requires listing all objects with the prefix and deleting each one — slow and non-atomic. With HNS, directory operations are real filesystem operations — instant.

---

## Blob Storage vs ADLS Gen2

| Feature | Blob Storage | ADLS Gen2 (HNS enabled) |
|---------|-------------|------------------------|
| **Directory operations** | Simulated (prefix-based) | Real (atomic rename, delete) |
| **POSIX permissions** | No | Yes (ACLs on folders/files) |
| **Spark performance** | OK | Optimized (3x faster for Spark) |
| **Cost** | Same | Same |
| **Use case** | App files, backups | Data lake for analytics |

Use ADLS Gen2 for any data engineering workload. Regular Blob Storage is for application assets.

---

## Data Lake Folder Structure Best Practices

```
adls-account/
  bronze/          ← raw, as-is from source, never modified
    {source}/
      {entity}/
        year={}/month={}/day={}/
          {filename}

  silver/          ← cleaned, typed, deduplicated (Delta format)
    {domain}/
      {entity}/

  gold/            ← aggregated, business-ready (Delta format)
    {domain}/
      {entity}/
```

**Partition by date** at the Bronze layer. Every analytics engine (Spark, Synapse, Athena) uses partition pruning to skip irrelevant data.

---

## Data Lake Pitfalls

**Data swamp:** A lake with no documentation, no governance, no ownership. Data lands but nobody knows where anything is or whether it's trustworthy.

Signs you have a swamp:
- Files named `final_v2_REAL_THIS_ONE.csv`
- No one knows who owns what
- Analysts re-extract from source because they don't trust the lake

**Fix:** Unity Catalog (Databricks), Purview (Azure), or at minimum a metadata catalog with table descriptions and owners.

**No schema enforcement at write:** Anyone can write bad data to a Parquet file. Without Delta + schema enforcement, a schema change in the source silently corrupts your lake.

---

## Accessing ADLS from Databricks

**Service Principal (recommended for production):**
```python
spark.conf.set("fs.azure.account.auth.type", "OAuth")
spark.conf.set("fs.azure.account.oauth.provider.type",
               "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider")
spark.conf.set("fs.azure.account.oauth2.client.id", "<client-id>")
spark.conf.set("fs.azure.account.oauth2.client.secret", dbutils.secrets.get("scope", "sp-secret"))
spark.conf.set("fs.azure.account.oauth2.client.endpoint",
               "https://login.microsoftonline.com/<tenant-id>/oauth2/token")

df = spark.read.parquet("abfss://bronze@myaccount.dfs.core.windows.net/sap/sales/")
```

**Managed Identity (best for Databricks on Azure):** Assign the managed identity of the Databricks workspace Storage Blob Data Contributor on ADLS. No credentials in code.
