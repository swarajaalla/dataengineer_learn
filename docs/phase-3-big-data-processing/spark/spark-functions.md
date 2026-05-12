---
sidebar_position: 3
---
# Spark Transformations and Actions

## What are Transformations?

Transformations are operations that create a new DataFrame/RDD from an existing one.

They do not execute immediately.

Spark only records the execution plan.

---

## Common Transformations

| Transformation | Purpose |
|---|---|
| select() | Select columns |
| filter() / where() | Filter rows |
| withColumn() | Add/modify columns |
| drop() | Remove columns |
| groupBy() | Aggregate data |
| join() | Combine datasets |
| orderBy() | Sort data |
| distinct() | Remove duplicates |
| union() | Merge datasets |
| repartition() | Increase partitions |

---

## Example

```python
df_filtered = df.filter(df["salary"] > 50000)

df_selected = df_filtered.select("name", "salary")
```

No execution happens yet.

---

# What are Actions?

Actions trigger actual execution of Spark jobs.

They return results or write data.

---

## Common Actions

| Action | Purpose |
|---|---|
| show() | Display data |
| count() | Count rows |
| collect() | Bring data to driver |
| first() | Return first row |
| take() | Return limited rows |
| write() | Save data |
| foreach() | Execute function on rows |

---

## Example

```python
df.filter(df["salary"] > 50000).show()
```

Spark executes the job only when `show()` runs.

---

# Spark Lazy Evaluation

## What is Lazy Evaluation?

Spark does not execute transformations immediately.

Instead:
- Builds a logical execution plan
- Optimizes the plan
- Executes only when action is triggered

---

## Why Spark Uses Lazy Evaluation

Benefits:
- Better optimization
- Reduced data movement
- Improved performance
- Avoid unnecessary computation

---

## Example

```python
df1 = df.filter(df["age"] > 25)

df2 = df1.select("name", "age")

df3 = df2.groupBy("age").count()
```

Still no execution.

Execution happens only after:

```python
df3.show()
```

---

# Spark DAG (Directed Acyclic Graph)

Spark internally creates a DAG for execution.

Workflow:

```text
Read Data
   ↓
Transformations
   ↓
Logical Plan
   ↓
Optimized DAG
   ↓
Execution
```

---

# Narrow vs Wide Transformations

Understanding this is very important for Spark optimization.

---

# Narrow Transformations

## What?

Data movement happens within the same partition.

No shuffle required.

Faster operations.

---

## Examples

- map()
- filter()
- withColumn()
- select()
- flatMap()

---

## Example

```python
df.filter(df["age"] > 30)
```

Only local partition processing happens.

---

## Advantages

- Faster execution
- Less network traffic
- Better performance

---

# Wide Transformations

## What?

Data moves across partitions.

Requires shuffle operation.

More expensive.

---

## Examples

- groupBy()
- join()
- distinct()
- repartition()
- orderBy()

---

## Example

```python
df.groupBy("country").count()
```

Spark redistributes data across executors.

---

# Shuffle in Spark

## What is Shuffle?

Redistribution of data across partitions/executors.

Occurs during:
- joins
- aggregations
- sorting

---

## Why Shuffle is Expensive

- Disk I/O
- Network transfer
- Serialization overhead
- Increased execution time

---

# Narrow vs Wide Comparison

| Feature | Narrow | Wide |
|---|---|---|
| Shuffle | No | Yes |
| Performance | Faster | Slower |
| Data Movement | Within partition | Across partitions |
| Resource Usage | Low | High |

---

# Spark Functions for Data Processing

# Column Functions

## select()

Used to select columns.

```python
df.select("name", "salary")
```

---

## withColumn()

Add or modify columns.

```python
from pyspark.sql.functions import col

df.withColumn("bonus", col("salary") * 0.1)
```

---

## drop()

Remove columns.

```python
df.drop("temp_column")
```

---

## alias()

Rename columns temporarily.

```python
df.select(col("salary").alias("emp_salary"))
```

---

# Filtering Functions

## filter()

Filter rows based on condition.

```python
df.filter(df["salary"] > 50000)
```

---

## where()

Same as filter.

```python
df.where(df["country"] == "India")
```

---

# Aggregation Functions

## groupBy()

Group records.

```python
df.groupBy("department").count()
```

---

## agg()

Multiple aggregations.

```python
from pyspark.sql.functions import sum, avg

df.groupBy("department").agg(
    sum("salary"),
    avg("salary")
)
```

---

# Join Functions

## join()

Combine datasets.

```python
df1.join(df2, "id", "inner")
```

---

## Join Types

- inner
- left
- right
- full
- anti
- semi

---

# Sorting Functions

## orderBy()

Sort data.

```python
df.orderBy("salary")
```

---

## desc()

Descending order.

```python
from pyspark.sql.functions import desc

df.orderBy(desc("salary"))
```

---

# Null Handling Functions

## dropna()

Remove null rows.

```python
df.dropna()
```

---

## fillna()

Replace null values.

```python
df.fillna(0)
```

---

# Duplicate Handling

## distinct()

Remove duplicates.

```python
df.distinct()
```

---

## dropDuplicates()

Remove duplicates using columns.

```python
df.dropDuplicates(["id"])
```

---

# String Functions

## upper()

Convert to uppercase.

```python
from pyspark.sql.functions import upper

df.select(upper(df["name"]))
```

---

## lower()

Convert to lowercase.

```python
from pyspark.sql.functions import lower

df.select(lower(df["name"]))
```

---

## concat()

Combine strings.

```python
from pyspark.sql.functions import concat

df.select(concat(df["first"], df["last"]))
```

---

# Date Functions

## current_date()

Get current date.

```python
from pyspark.sql.functions import current_date

df.select(current_date())
```

---

## datediff()

Difference between dates.

```python
from pyspark.sql.functions import datediff

df.select(datediff("end_date", "start_date"))
```

---

# Performance Tips

- Avoid unnecessary wide transformations
- Reduce shuffle operations
- Filter early
- Use partitioning wisely
- Avoid excessive `collect()`
- Cache reused DataFrames only when needed

---

# Interview Questions

## Difference between transformation and action?

Transformations create execution plans.
Actions trigger execution.

---

## Why are wide transformations expensive?

Because they involve shuffle across executors.

---

## What is lazy evaluation in Spark?

Spark delays execution until an action is triggered.

---

## Which operation causes shuffle?

Examples:
- groupBy
- join
- orderBy
- distinct

---

# Real-World Example

```text
Raw CSV Files
      ↓
filter()
      ↓
withColumn()
      ↓
join()
      ↓
groupBy()
      ↓
write()
```

Spark optimizes the entire workflow before execution.