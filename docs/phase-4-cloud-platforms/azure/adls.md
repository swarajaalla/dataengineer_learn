---
title: Azure Data Lake Storage
sidebar_position: 4
description: Learn about storage
---

# Azure Data Lake Storage Gen2 (ADLS Gen2)

Azure Data Lake Storage Gen2 (ADLS Gen2) is the primary storage layer used in Azure data engineering architectures.

It is built on top of Azure Blob Storage and optimized for:
- Big data analytics
- Distributed processing
- Spark workloads
- Data lake architectures
- Enterprise-scale storage

ADLS Gen2 is the foundation for:
- Azure Databricks
- Synapse Analytics
- Azure Data Factory
- Delta Lake
- Medallion Architecture

---

# What Is ADLS Gen2?

ADLS Gen2 = Azure Blob Storage + Hierarchical Namespace (HNS)

Hierarchical Namespace enables:
- Real folder hierarchy
- Faster directory operations
- Fine-grained ACL permissions
- Better big data performance

Without HNS:
```text
folder1/file.csv
```

is only a blob name.

With HNS:
```text
folder1/
   └── file.csv
```

becomes a true filesystem structure.

---

# Why ADLS Gen2?

ADLS Gen2 is designed for:
- Massive scalability
- Cheap storage
- Parallel processing
- High throughput analytics
- Secure enterprise data lakes

---

# Key Features

| Feature | Description |
|---|---|
| Hierarchical Namespace | True directory structure |
| Massive Scalability | Petabyte-scale storage |
| Low Cost | Cheap blob-based storage |
| Security | RBAC + ACL support |
| High Throughput | Optimized for Spark and analytics |
| Multi-Protocol Access | Blob + DFS endpoints |
| Lifecycle Policies | Automated tier management |
| Integration | Works with ADF, Databricks, Synapse |

---

# ADLS Gen2 Architecture

```text
Storage Account
      ↓
Containers
      ↓
Folders
      ↓
Files
```

Example:

```text
mystorageaccount
    ↓
bronze
    ↓
sap/orders/year=2026/month=01/day=15/
    ↓
part-0000.parquet
```

---

# Storage Account

Top-level Azure storage resource.

Contains:
- Containers
- Security settings
- Networking rules
- Lifecycle policies

Example:
```text
mystorageaccount
```

---

# Containers

Containers are similar to top-level folders or buckets.

Best Practice:
Use separate containers for:
- Bronze
- Silver
- Gold

Example:

```text
bronze/
silver/
gold/
```

---

# Typical Data Lake Structure

```text
Storage Account
└── bronze
    └── sap/
        └── orders/
            └── year=2026/month=01/day=15/

└── silver
    └── curated/orders/

└── gold
    └── business_metrics/
```

---

# Medallion Architecture in ADLS

## Bronze Layer
Raw ingested data.

Characteristics:
- Minimal transformations
- Append-only
- Source-aligned

---

## Silver Layer
Cleaned and transformed data.

Characteristics:
- Standardized schema
- Deduplication
- Business rules applied

---

## Gold Layer
Business-ready data.

Characteristics:
- Aggregated
- Optimized for reporting
- Used by BI tools

---

# Supported File Formats

| Format | Usage |
|---|---|
| CSV | Raw ingestion |
| JSON | APIs and semi-structured data |
| Parquet | Most common analytics format |
| Delta | ACID lakehouse tables |
| Avro | Streaming and Kafka ecosystems |
| ORC | Hive/Spark optimization |

---

# Why Parquet Is Preferred

Advantages:
- Columnar storage
- Compression
- Faster reads
- Predicate pushdown
- Better Spark optimization

Avoid large CSV datasets for analytics workloads.

---

# Access Methods

## Managed Identity (Recommended)

Best and most secure approach.

Advantages:
- No secrets
- No credential rotation
- Better governance

Grant RBAC access to:
- Databricks
- ADF
- Synapse

Example:
```text
Databricks Managed Identity
        ↓
Storage Blob Data Contributor
        ↓
ADLS Gen2
```

---

# RBAC Roles

Common roles:

| Role | Usage |
|---|---|
| Storage Blob Data Reader | Read-only access |
| Storage Blob Data Contributor | Read/write access |
| Storage Blob Data Owner | Full blob permissions |

---

# ACLs (Access Control Lists)

ADLS supports POSIX-style ACLs.

Permissions:
```text
rwx
```

Applied at:
- Folder level
- File level

Useful for:
- Department-level access
- Fine-grained security
- Multi-team environments

---

# Service Principal Authentication

Used when Managed Identity is unavailable.

Example:
- External applications
- Cross-tenant access
- CI/CD pipelines

Databricks example:

```python
spark.conf.set(f"fs.azure.account.auth.type.{account}.dfs.core.windows.net", "OAuth")

spark.conf.set(
    f"fs.azure.account.oauth.provider.type.{account}.dfs.core.windows.net",
    "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider"
)

spark.conf.set(
    f"fs.azure.account.oauth2.client.id.{account}.dfs.core.windows.net",
    client_id
)

spark.conf.set(
    f"fs.azure.account.oauth2.client.secret.{account}.dfs.core.windows.net",
    dbutils.secrets.get("kv-scope", "sp-secret")
)

spark.conf.set(
    f"fs.azure.account.oauth2.client.endpoint.{account}.dfs.core.windows.net",
    f"https://login.microsoftonline.com/{tenant_id}/oauth2/token"
)
```

---

# ABFSS Protocol

ADLS Gen2 uses:

```text
abfss://
```

Example:

```text
abfss://bronze@mystorageaccount.dfs.core.windows.net/sap/orders/
```

Components:

| Part | Meaning |
|---|---|
| bronze | Container |
| mystorageaccount | Storage account |
| dfs.core.windows.net | DFS endpoint |
| sap/orders | Folder path |

---

# Reading Data from ADLS

## Read Parquet

```python
df = spark.read.parquet(
    "abfss://bronze@mystorageaccount.dfs.core.windows.net/sap/orders/"
)
```

---

## Read Delta

```python
df = spark.read.format("delta").load(
    "abfss://silver@mystorageaccount.dfs.core.windows.net/orders/"
)
```

---

# Writing Data to ADLS

## Write Delta

```python
df.write.format("delta") \
    .partitionBy("order_year") \
    .mode("overwrite") \
    .save("abfss://silver@mystorageaccount.dfs.core.windows.net/orders/")
```

---

# Partitioning Strategy

Partitioning improves:
- Query performance
- Parallel reads
- Cost optimization

Common partitions:
- year
- month
- day
- country
- region

Example:

```text
/orders/year=2026/month=01/day=15/
```

Avoid:
- Over-partitioning
- Tiny files

---

# Small File Problem

Too many tiny files reduce Spark performance.

Bad:
```text
10 million files × 1 KB
```

Good:
```text
100 files × 100 MB
```

Best Practice:
Optimize file sizes between:
```text
100 MB – 1 GB
```

---

# Lifecycle Management

Automatically move old data to cheaper tiers.

Storage tiers:
| Tier | Usage |
|---|---|
| Hot | Frequently accessed |
| Cool | Rarely accessed |
| Archive | Long-term retention |

Example lifecycle policy:

```json
{
  "rules": [{
    "name": "archive-old-bronze",
    "type": "Lifecycle",
    "definition": {
      "filters": {
        "blobTypes": ["blockBlob"],
        "prefixMatch": ["bronze/"]
      },
      "actions": {
        "baseBlob": {
          "tierToCool": {
            "daysAfterModificationGreaterThan": 30
          },
          "tierToArchive": {
            "daysAfterModificationGreaterThan": 90
          },
          "delete": {
            "daysAfterModificationGreaterThan": 365
          }
        }
      }
    }
  }]
}
```

---

# Soft Delete

Protects against accidental deletion.

Benefits:
- Recovery capability
- Prevents permanent loss
- Useful in production environments

Typical retention:
```text
7–30 days
```

---

# Networking & Security

## Private Endpoint
Private access to storage account.

Avoids public internet exposure.

---

## Firewall Rules
Restrict allowed networks/IPs.

---

## Encryption
ADLS supports:
- Encryption at rest
- Encryption in transit

---

## Key Vault Integration
Store secrets securely.

Never hardcode:
- Keys
- Passwords
- Secrets

---

# Integration with Azure Services

| Service | Purpose |
|---|---|
| ADF | Data ingestion |
| Databricks | Spark transformations |
| Synapse | SQL analytics |
| Power BI | Reporting |
| Event Hub | Streaming ingestion |

---

# Performance Optimization

## Best Practices
- Use Parquet/Delta
- Partition wisely
- Avoid small files
- Use compression
- Use Delta Lake for ACID support
- Enable caching where applicable

---

# Cost Optimization

## Reduce Costs By
- Using Cool/Archive tiers
- Lifecycle policies
- Compressing files
- Removing unused data
- Avoiding duplicate datasets

---

# Common Enterprise Design Pattern

```text
SAP / APIs / Databases
            ↓
ADF Pipelines
            ↓
ADLS Bronze
            ↓
Databricks Transformations
            ↓
ADLS Silver
            ↓
ADLS Gold
            ↓
Synapse / Power BI
```

---

# Common Interview Questions

## Difference Between Blob Storage and ADLS Gen2

| Blob Storage | ADLS Gen2 |
|---|---|
| Object storage | Object storage + filesystem |
| No HNS | Supports HNS |
| Limited ACL support | Fine-grained ACLs |
| General storage | Optimized for analytics |

---

## Why Use Parquet Instead of CSV?

Parquet provides:
- Compression
- Faster reads
- Columnar storage
- Better Spark optimization

---

## Why Enable Hierarchical Namespace?

Required for:
- ACLs
- Directory operations
- Big data analytics optimization

Cannot be enabled after storage account creation.

---

# Best Practices

- Enable Hierarchical Namespace during creation
- Use separate Bronze/Silver/Gold containers
- Prefer Managed Identity over keys
- Use Delta + Parquet
- Partition large datasets
- Enable soft delete
- Use lifecycle policies
- Secure storage with Private Endpoints
- Avoid tiny files

---

# Key Takeaways

- ADLS Gen2 is the foundation of Azure data lakes.
- It combines Blob Storage with Hierarchical Namespace.
- ADLS is optimized for Spark and analytics workloads.
- Managed Identity is the preferred authentication method.
- Partitioning and file optimization are critical for performance.
- Lifecycle management reduces storage costs.
- ADLS integrates tightly with Databricks, ADF, and Synapse.