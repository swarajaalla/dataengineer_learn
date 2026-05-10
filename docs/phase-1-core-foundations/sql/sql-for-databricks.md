---
sidebar_position: 6
---

# SQL for Databricks

Databricks SQL is ANSI SQL with Spark extensions. If you know standard SQL, the differences are small but important.

---

## Running SQL in Databricks

Three ways to write SQL in Databricks:

1. **Databricks SQL Editor** — dedicated SQL workspace, connects to SQL Warehouse
2. **Notebook cells** — use `%sql` magic or `spark.sql("...")`
3. **dbt** — runs SQL models against Databricks

```python
# In a Python notebook cell
result = spark.sql("""
    SELECT region, SUM(amount) AS revenue
    FROM silver.orders
    WHERE order_date >= '2024-01-01'
    GROUP BY region
""")
display(result)
```

---

## Databricks SQL Extensions

### Three-Part Names (Unity Catalog)

```sql
SELECT * FROM catalog_name.schema_name.table_name;
SELECT * FROM prod_catalog.silver.orders;
```

### DESCRIBE and SHOW

```sql
DESCRIBE TABLE silver.orders;           -- column names, types, nullability
DESCRIBE DETAIL silver.orders;          -- Delta metadata, num files, size
DESCRIBE HISTORY silver.orders;         -- all versions and operations

SHOW TABLES IN silver;                  -- list all tables in schema
SHOW SCHEMAS IN prod_catalog;           -- list all schemas
SHOW CATALOGS;                          -- list all catalogs
```

### OPTIMIZE and VACUUM (Delta only)

```sql
-- Compact small files
OPTIMIZE silver.orders;

-- Compact + Z-ORDER by query columns
OPTIMIZE silver.orders ZORDER BY (customer_id, order_date);

-- Delete old file versions (default 7 day retention)
VACUUM silver.orders;
VACUUM silver.orders RETAIN 168 HOURS;
```

---

## Delta Lake SQL

### CREATE TABLE

```sql
-- Managed Delta table
CREATE TABLE silver.orders (
    order_id     STRING NOT NULL,
    customer_id  STRING,
    order_date   DATE,
    amount       DECIMAL(18,2),
    status       STRING,
    _ingest_ts   TIMESTAMP
) USING DELTA
PARTITIONED BY (order_date);

-- External Delta table (data on ADLS)
CREATE TABLE silver.orders
USING DELTA
LOCATION 'abfss://silver@mystorageaccount.dfs.core.windows.net/orders/';
```

### INSERT OVERWRITE / REPLACE WHERE

```sql
-- Replace specific partition only (atomic, safe)
INSERT OVERWRITE silver.orders
REPLACE WHERE order_date = '2024-01-15'
SELECT * FROM bronze.orders_raw WHERE order_date = '2024-01-15';
```

### MERGE INTO (Upsert)

```sql
MERGE INTO silver.orders AS target
USING new_records AS source
ON target.order_id = source.order_id
WHEN MATCHED AND source.updated_at > target.updated_at
    THEN UPDATE SET *
WHEN NOT MATCHED
    THEN INSERT *;
```

### Time Travel

```sql
SELECT * FROM silver.orders VERSION AS OF 5;
SELECT * FROM silver.orders TIMESTAMP AS OF '2024-06-01 00:00:00';

-- Restore to a previous version
RESTORE TABLE silver.orders TO VERSION AS OF 10;
```

---

## Databricks-Specific Functions

```sql
-- Array functions
ARRAY_CONTAINS(tags, 'premium')      -- true if array includes value
EXPLODE(tags)                        -- one row per array element
FLATTEN(nested_array)                -- flatten nested array

-- Struct functions
col.field_name                       -- access struct field
STRUCT(a, b, c)                      -- create struct

-- JSON
GET_JSON_OBJECT(json_col, '$.key')   -- extract from JSON string
FROM_JSON(json_str, schema)          -- parse JSON into struct

-- Approximate aggregations (fast on large tables)
APPROX_COUNT_DISTINCT(customer_id)   -- fast unique count estimate
PERCENTILE_APPROX(amount, 0.5)       -- approximate median
```

---

## Auto Loader SQL (Streaming)

```sql
-- Read files as they arrive (streaming)
CREATE OR REPLACE STREAMING TABLE bronze.raw_events
AS SELECT * FROM cloud_files(
    'abfss://landing@storage.dfs.core.windows.net/events/',
    'json',
    map('cloudFiles.schemaLocation', '/mnt/schema/events')
);
```

---

## Key Differences from Standard SQL

| Feature | Databricks | Standard SQL |
|---------|------------|-------------|
| Upsert | `MERGE INTO` | Varies |
| File format | `USING DELTA` | N/A |
| History | `DESCRIBE HISTORY` | N/A |
| Time travel | `VERSION AS OF` | N/A |
| Case sensitivity | Case-insensitive by default | Varies |
| Nested data | `struct.field`, `EXPLODE()` | Vendor-specific |
