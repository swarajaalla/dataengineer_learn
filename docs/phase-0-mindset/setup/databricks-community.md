---
sidebar_position: 4
---

# Databricks Community Edition Setup

Databricks Community Edition is a free Databricks workspace — enough to practice Spark, Delta Lake, and notebooks without a cloud subscription.

---

## Create an Account

1. Go to [community.cloud.databricks.com](https://community.cloud.databricks.com)
2. Sign up with your email
3. You get a free cluster (single-node, limited memory)

---

## Create Your First Cluster

1. Go to **Compute** → **Create compute**
2. Select **Single Node** (free tier only supports this)
3. Choose the latest Databricks Runtime (e.g., 15.4 LTS)
4. Click **Create compute**

The cluster auto-terminates after 2 hours of inactivity. Restart it from the Compute page.

---

## Create Your First Notebook

1. Go to **Workspace** → **Create** → **Notebook**
2. Name it `test-spark`
3. Select **Python** as the default language
4. Attach it to your cluster

---

## Test PySpark

```python
# Cell 1 — Create a sample DataFrame
from pyspark.sql.functions import col

data = [
    ("order_1", "customer_1", 500.0),
    ("order_2", "customer_2", 1200.0),
    ("order_3", "customer_1", 300.0),
]
df = spark.createDataFrame(data, ["order_id", "customer_id", "amount"])
df.show()
```

```python
# Cell 2 — Filter and transform
df_high_value = df.filter(col("amount") > 400)
display(df_high_value)
```

```python
# Cell 3 — Write to Delta
df.write.format("delta").mode("overwrite").saveAsTable("default.test_orders")
spark.sql("SELECT * FROM default.test_orders").show()
```

---

## Key Limitations of Community Edition

| Limitation | Workaround |
|-----------|------------|
| Single-node only (no multi-worker cluster) | Fine for learning — Spark concepts are the same |
| No Unity Catalog | Use legacy Hive metastore for practice |
| No production jobs | Use for notebooks and exploration only |
| Cluster terminates after 2h idle | Save work, restart cluster |
| No ADLS connection (no Azure subscription) | Practice with local data / DBFS |

---

## DBFS (Databricks File System)

Community Edition uses DBFS instead of ADLS. The path syntax is the same:

```python
# Write to DBFS
df.write.parquet("/FileStore/data/orders")

# Read from DBFS
df = spark.read.parquet("/FileStore/data/orders")

# List files
display(dbutils.fs.ls("/FileStore/data/"))
```

---

## When to Upgrade

Once you're comfortable with Spark basics and Delta Lake, move to a paid Azure or AWS account (use free credits) to practice:
- ADLS Gen2 connections
- ADF orchestration
- Unity Catalog
- Multi-node clusters
