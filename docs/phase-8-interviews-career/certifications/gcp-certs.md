---
sidebar_position: 7
---

# GCP Certifications for Data Engineers

Google Cloud has a well-structured certification program for data. The **Professional Data Engineer** is the flagship and one of the most respected cloud data certifications in the industry.

---

## GCP Certification Path for DE

```
Associate Cloud Engineer (optional — useful background)
    ↓
Professional Data Engineer          ← primary target
    ↓
Professional Cloud Architect        (optional — senior/architect track)
Professional Machine Learning Engineer (optional — if ML track)
```

---

## Professional Data Engineer (PDE)

One of the most widely recognised cloud data certs. Broad exam covering GCP data services end to end.

### What It Covers

| Domain | Weight |
|--------|--------|
| Designing data processing systems | 22% |
| Ingesting and processing data | 25% |
| Storing data | 20% |
| Preparing and using data for analysis | 15% |
| Maintaining and automating data workloads | 18% |

**Core services tested:**
- BigQuery — partitioning, clustering, pricing, external tables, BI Engine, ML
- Cloud Storage (GCS) — storage classes, lifecycle, access control
- Dataflow — Apache Beam, batch and streaming pipelines, windowing, watermarks
- Dataproc — managed Spark/Hadoop, ephemeral clusters, autoscaling
- Pub/Sub — topics, subscriptions, ordering, dead-letter topics
- Cloud Composer — managed Apache Airflow for orchestration
- Looker / Looker Studio — BI reporting
- Dataform — SQL-based data transformation (like dbt, native to GCP)
- Cloud Spanner, Bigtable, Firestore — NoSQL/NewSQL options
- Data Catalog — metadata management and discovery
- Vertex AI — ML platform (high-level understanding needed)

### Exam Format

- Duration: 120 minutes
- Questions: 50–60 multiple choice
- Passing score: Not published (approximately 80%)
- Cost: $200 USD
- Valid for: 2 years

### Key Topics to Focus On

**BigQuery — most tested:**
```sql
-- Partitioned + clustered table (correct answer for most perf questions)
CREATE TABLE gold.fact_sales
PARTITION BY sale_date
CLUSTER BY region, customer_id
OPTIONS (
    partition_expiration_days = 365,
    require_partition_filter = true   -- force partition pruning on queries
);

-- Cost estimate before running
SELECT ... FROM gold.fact_sales
-- Check "This query will process X MB" in UI before running

-- BigQuery ML — train a model in SQL
CREATE MODEL sales_model.linear_regression
OPTIONS (model_type='linear_reg', input_label_cols=['revenue'])
AS SELECT region, month, revenue FROM gold.monthly_sales;
```

**Dataflow (Apache Beam) — often tested:**
```python
import apache_beam as beam

with beam.Pipeline() as p:
    (
        p
        | 'Read from GCS' >> beam.io.ReadFromText('gs://bucket/input/*.csv')
        | 'Parse CSV' >> beam.Map(parse_row)
        | 'Filter valid' >> beam.Filter(lambda r: r['amount'] > 0)
        | 'Write to BigQuery' >> beam.io.WriteToBigQuery(
            'project:dataset.table',
            schema='order_id:STRING,amount:FLOAT,order_date:DATE',
            write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND
        )
    )
```

**Windowing in Dataflow (streaming):**
```python
# Fixed window — non-overlapping (e.g. hourly aggregations)
beam.WindowInto(beam.window.FixedWindows(3600))

# Sliding window — overlapping (e.g. 1-hour window every 15 minutes)
beam.WindowInto(beam.window.SlidingWindows(3600, 900))

# Session window — gap-based (e.g. user sessions)
beam.WindowInto(beam.window.Sessions(gap_size=300))
```

**Commonly Missed:**
- Dataproc vs Dataflow — when to choose each (Dataproc = existing Spark code; Dataflow = beam pipelines or serverless)
- BigQuery slots vs on-demand pricing — slots for predictable cost, on-demand for variable
- Pub/Sub message ordering — requires ordering key + single partition
- Cloud Composer vs Cloud Scheduler — Composer for DAG orchestration; Scheduler for simple cron triggers
- Bigtable vs BigQuery — Bigtable for low-latency key-value lookups; BigQuery for analytical queries

### Study Resources

| Resource | Cost | Notes |
|----------|------|-------|
| Google Cloud Skills Boost — Data Engineer path | Free credits | Official, hands-on labs |
| GCP free tier | Free | $300 credit for new accounts |
| Udemy (Dan Sullivan's PDE course) | ~$15 | Most popular structured course |
| Google Cloud official sample questions | Free | On the exam page — start here |
| "Data Engineering on Google Cloud" (Coursera) | ~$50/month | Deep practical content |

### Sample Questions

**Q: You need to query BigQuery data with sub-second latency for a dashboard with millions of daily users. What do you use?**  
A: BigQuery BI Engine — in-memory acceleration layer for fast, concurrent dashboard queries.

**Q: Your Dataflow streaming pipeline is falling behind. Messages in Pub/Sub are accumulating. What do you investigate first?**  
A: Check worker CPU and memory utilisation. If at capacity, increase `maxNumWorkers` for autoscaling. Also check if a `GroupByKey` operation is causing a shuffle bottleneck.

**Q: You want to run existing Apache Spark jobs on GCP with minimal code changes. What service?**  
A: Dataproc — managed Spark that runs your existing PySpark code as-is. Dataflow requires rewriting in Apache Beam.

---

## Associate Cloud Engineer (ACE)

A good foundation cert if you're new to GCP — covers core services (Compute, Storage, networking, IAM) without going deep on data.

- Duration: 120 minutes | Cost: $200 | Passing: ~70%
- **Recommended before PDE** if you have no GCP experience

---

## Recommended Order for GCP

1. **Professional Data Engineer** — primary, most recognised
2. **Associate Cloud Engineer** — if you need GCP foundation first
3. **Professional ML Engineer** — if ML/AI is part of your role
