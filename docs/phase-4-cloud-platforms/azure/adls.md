---
sidebar_position: 1
---

# Azure Data Lake Storage Gen2 (ADLS)

ADLS Gen2 is the primary storage layer for all Azure data engineering pipelines. It's blob storage with a hierarchical namespace — the foundation of the Azure data lake.

---

## What Is ADLS Gen2?

Azure Data Lake Storage Gen2 = Azure Blob Storage + Hierarchical Namespace (HNS).

The HNS enables:
- True folder structure (not simulated with `/` in names)
- Fine-grained ACLs at folder and file level
- Better performance for directory operations

---

## Structure

```
Storage Account (mystorageaccount)
└── Container (bronze / silver / gold)
    └── Folder hierarchy
        ├── sap/
        │   └── orders/
        │       ├── year=2024/month=01/day=15/
        │       │   └── part-0000.parquet
        └── api/
            └── salesforce/
```

**ABFSS protocol:** `abfss://container@account.dfs.core.windows.net/path/`

---

## Access Methods

### Managed Identity (Best — No Credentials)

Grant the Databricks workspace or ADF managed identity an RBAC role on the storage account:

```bash
# Azure CLI — grant Storage Blob Data Contributor
az role assignment create \
    --assignee <managed-identity-principal-id> \
    --role "Storage Blob Data Contributor" \
    --scope /subscriptions/.../storageAccounts/mystorageaccount
```

In Databricks with Unity Catalog — use External Locations backed by managed identity. No secrets needed.

### Service Principal (When Managed Identity Not Available)

```python
# Databricks — configure via Spark config (before any reads)
spark.conf.set(f"fs.azure.account.auth.type.{account}.dfs.core.windows.net", "OAuth")
spark.conf.set(f"fs.azure.account.oauth.provider.type.{account}.dfs.core.windows.net",
               "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider")
spark.conf.set(f"fs.azure.account.oauth2.client.id.{account}.dfs.core.windows.net", client_id)
spark.conf.set(f"fs.azure.account.oauth2.client.secret.{account}.dfs.core.windows.net",
               dbutils.secrets.get("kv-scope", "sp-secret"))
spark.conf.set(f"fs.azure.account.oauth2.client.endpoint.{account}.dfs.core.windows.net",
               f"https://login.microsoftonline.com/{tenant_id}/oauth2/token")
```

---

## Reading and Writing from Databricks

```python
# Read
df = spark.read.parquet("abfss://bronze@mystorageaccount.dfs.core.windows.net/sap/orders/")
df = spark.read.format("delta").load("abfss://silver@mystorageaccount.dfs.core.windows.net/orders/")

# Write
df.write.format("delta") \
    .partitionBy("order_year") \
    .mode("overwrite") \
    .save("abfss://silver@mystorageaccount.dfs.core.windows.net/orders/")
```

---

## Lifecycle Management

Automatically move data between tiers to save costs:

```json
{
  "rules": [{
    "name": "archive-old-bronze",
    "type": "Lifecycle",
    "definition": {
      "filters": {"blobTypes": ["blockBlob"], "prefixMatch": ["bronze/"]},
      "actions": {
        "baseBlob": {
          "tierToCool": {"daysAfterModificationGreaterThan": 30},
          "tierToArchive": {"daysAfterModificationGreaterThan": 90},
          "delete": {"daysAfterModificationGreaterThan": 365}
        }
      }
    }
  }]
}
```

---

## Best Practices

- Use separate containers for Bronze, Silver, and Gold
- Always enable hierarchical namespace (cannot be changed after creation)
- Use managed identity for access — never storage account keys in code
- Partition data by date for efficient reads and lifecycle management
- Enable soft delete (protects against accidental deletion — 7 day recovery)
