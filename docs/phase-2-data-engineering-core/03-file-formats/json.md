---
sidebar_position: 3
---

# JSON

JSON (JavaScript Object Notation) is the standard format for API responses and event data. It supports nested structures that CSV can't represent — which makes it powerful and difficult to query.

---

## What It Is

A text-based, self-describing format with key-value pairs, arrays, and nested objects.

```json
{
  "orderId": "ORD-123",
  "customer": {
    "id": "C-456",
    "name": "Acme Corp",
    "tier": "enterprise"
  },
  "lineItems": [
    {"sku": "PROD-1", "qty": 10, "price": 99.99},
    {"sku": "PROD-2", "qty": 5, "price": 24.99}
  ],
  "shipping": {
    "method": "express",
    "address": {"city": "Berlin", "country": "DE"}
  },
  "tags": ["priority", "vip"],
  "cancelledAt": null
}
```

---

## JSON Lines (JSONL / NDJSON) — Use This for Streaming

Regular JSON in a file means one giant JSON object or array — not splittable, not streamable.

JSON Lines: one JSON object per line, newline-delimited.

```
{"orderId": "ORD-123", "total": 150.00, "ts": "2024-01-15T09:00:00Z"}
{"orderId": "ORD-124", "total": 89.50, "ts": "2024-01-15T09:00:01Z"}
{"orderId": "ORD-125", "total": 220.00, "ts": "2024-01-15T09:00:02Z"}
```

**Why JSONL is better for DE:**
- Each line is an independent record — splittable for parallel reads
- Append-friendly — just add a new line
- Streaming systems (Kafka, Event Hub) produce JSONL naturally
- Spark reads JSONL faster than nested JSON arrays

---

## The Problem with Nested JSON for Analytics

```sql
-- You want: total revenue by customer tier
-- The tier is NESTED inside customer object
-- You can't do this directly:
SELECT customer.tier, SUM(lineItems.price * lineItems.qty)
FROM raw_json_table
```

You need to **flatten** the structure first.

---

## Flattening JSON in Spark

```python
from pyspark.sql.functions import col, explode, from_json
from pyspark.sql.types import *

# Define schema (better than inferSchema — avoids full scan)
line_item_schema = ArrayType(StructType([
    StructField("sku", StringType()),
    StructField("qty", IntegerType()),
    StructField("price", DoubleType())
]))

order_schema = StructType([
    StructField("orderId", StringType()),
    StructField("customer", StructType([
        StructField("id", StringType()),
        StructField("name", StringType()),
        StructField("tier", StringType())
    ])),
    StructField("lineItems", line_item_schema),
])

# Read JSONL
df = spark.read.schema(order_schema).json("abfss://bronze@account.dfs.core.windows.net/api/orders/")

# Flatten nested struct
df_flat = df.select(
    col("orderId"),
    col("customer.id").alias("customer_id"),
    col("customer.name").alias("customer_name"),
    col("customer.tier").alias("customer_tier"),
    col("lineItems")
)

# Explode array: one row per line item
df_exploded = df_flat.withColumn("item", explode(col("lineItems"))) \
    .select(
        col("orderId"),
        col("customer_id"),
        col("customer_tier"),
        col("item.sku"),
        col("item.qty"),
        col("item.price"),
        (col("item.qty") * col("item.price")).alias("line_total")
    )
```

---

## Reading JSON from a String Column (Kafka / Event Hub)

When data arrives as a string (Kafka value column), parse it at read time:

```python
# Kafka message body is a string
raw_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "eventhub.servicebus.windows.net:9093") \
    .load()

# Parse the JSON string
parsed_df = raw_df.select(
    from_json(col("value").cast("string"), order_schema).alias("data")
).select("data.*")
```

---

## JSON vs Parquet for Storage

| Property | JSON | Parquet |
|----------|------|---------|
| **Storage size** | Large (verbose text) | 5-10x smaller (binary + compressed) |
| **Read speed (analytics)** | Slow (row scan) | Fast (columnar reads) |
| **Write speed** | Fast | Medium |
| **Schema** | Self-describing, flexible | Fixed (enforced) |
| **Nested data** | Native | Supported but less natural |
| **Human-readable** | Yes | No |

**The pattern:** Land JSON in Bronze (preserve raw), convert to Delta in Silver.

```
API response (JSON) → ADLS Bronze (JSON as-is) → Databricks flatten → ADLS Silver (Delta)
```

Never store years of JSON in a queryable layer. Convert early.

---

## Common Pitfalls

| Issue | What happens | Fix |
|-------|-------------|-----|
| Schema drift | New field appears in API response | Use `mergeSchema` in Delta or schema evolution |
| Null fields | Field missing vs field null | Both read as null in Spark — same result |
| Deeply nested (5+ levels) | Flatten logic gets complex | Flatten step by step, one level at a time |
| Large arrays | Explode creates massive row explosion | Filter before explode, or aggregate first |
| Date as string | `"2024-01-15"` not parsed as date | Cast explicitly: `to_date(col("date"), "yyyy-MM-dd")` |
