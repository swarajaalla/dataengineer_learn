---
sidebar_position: 1
---

# Cheatsheets

Quick reference cards for the most-used commands and patterns.

---

## PySpark Quick Reference

```python
# Read
spark.read.format("delta").load("path")
spark.read.parquet("path")
spark.read.csv("path", header=True, inferSchema=True)
spark.table("catalog.schema.table")

# Write
df.write.format("delta").mode("overwrite").saveAsTable("schema.table")
df.write.format("delta").mode("append").save("path")
df.write.format("delta").mode("overwrite").option("overwriteSchema","true").save("path")

# Transform
df.filter(col("status") == "active")
df.select("col1", "col2", col("col3").alias("new_name"))
df.withColumn("new_col", col("a") + col("b"))
df.drop("col1", "col2")
df.dropDuplicates(["order_id"])
df.orderBy(col("amount").desc())
df.limit(100)

# Join
df.join(other, on="id", how="left")         # left, inner, right, full, anti, semi
df.join(other, df.id == other.order_id)     # different column names

# Aggregate
df.groupBy("region").agg(sum("amount"), count("order_id"), avg("amount"))
df.agg(max("amount"), min("amount"))

# Window
from pyspark.sql.window import Window
w = Window.partitionBy("customer_id").orderBy("order_date")
df.withColumn("rn", row_number().over(w))
df.withColumn("prev", lag("amount", 1).over(w))

# Type cast
df.withColumn("amount", col("amount").cast("decimal(18,2)"))
df.withColumn("date", to_date(col("date_str"), "yyyy-MM-dd"))
df.withColumn("ts", to_timestamp(col("ts_str")))

# Null handling
df.filter(col("id").isNotNull())
df.fillna({"amount": 0, "status": "unknown"})
df.na.drop(subset=["order_id", "amount"])
```

---

## Delta Lake Quick Reference

```sql
-- Create
CREATE TABLE schema.table USING DELTA LOCATION 'path';
CREATE TABLE schema.table USING DELTA PARTITIONED BY (order_date);

-- Merge (Upsert)
MERGE INTO target AS t USING source AS s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

-- Time travel
SELECT * FROM schema.table VERSION AS OF 5;
SELECT * FROM schema.table TIMESTAMP AS OF '2024-01-01';
RESTORE TABLE schema.table TO VERSION AS OF 10;

-- Maintenance
OPTIMIZE schema.table;
OPTIMIZE schema.table ZORDER BY (customer_id);
VACUUM schema.table;
VACUUM schema.table RETAIN 168 HOURS;

-- Metadata
DESCRIBE TABLE schema.table;
DESCRIBE DETAIL schema.table;
DESCRIBE HISTORY schema.table;
```

---

## SQL Window Functions Quick Reference

```sql
-- Ranking
ROW_NUMBER() OVER (PARTITION BY grp ORDER BY col DESC)
RANK()        OVER (PARTITION BY grp ORDER BY col DESC)
DENSE_RANK()  OVER (PARTITION BY grp ORDER BY col DESC)
NTILE(4)      OVER (ORDER BY col)

-- Offset
LAG(col, 1)  OVER (PARTITION BY grp ORDER BY col)
LEAD(col, 1) OVER (PARTITION BY grp ORDER BY col)

-- Aggregates
SUM(col)  OVER (PARTITION BY grp ORDER BY date ROWS UNBOUNDED PRECEDING)
AVG(col)  OVER (PARTITION BY grp ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
COUNT(*)  OVER (PARTITION BY grp)

-- Value
FIRST_VALUE(col) OVER (PARTITION BY grp ORDER BY date)
LAST_VALUE(col)  OVER (PARTITION BY grp ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
```

---

## ADF Expressions Quick Reference

```
@pipeline().parameters.param_name         -- pipeline parameter
@activity('ActivityName').output.value    -- output from activity
@trigger().startTime                      -- trigger time
@formatDateTime(utcnow(), 'yyyy-MM-dd')   -- today's date string
@concat(variables('prefix'), '_', string(pipeline().parameters.id))
@if(equals(pipeline().parameters.load_type, 'full'), 'TRUNCATE', 'MERGE')
```

---

## Git Quick Reference

```bash
git checkout -b feature/my-pipeline    # new branch
git add src/ingestion/orders.py        # stage specific file
git commit -m "feat: add orders pipeline"
git push origin feature/my-pipeline
git pull origin main                   # sync with main
git log --oneline -10                  # recent history
git diff main...HEAD                   # changes vs main
git stash / git stash pop              # save/restore WIP
```
