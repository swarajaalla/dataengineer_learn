---
sidebar_position: 6
---

# AWS Certifications for Data Engineers

AWS has a clear certification path for data engineering. The **AWS Certified Data Engineer – Associate** (launched 2023) is the most directly relevant, replacing the older Big Data Specialty as the go-to data cert.

---

## AWS Certification Path for DE

```
AWS Certified Cloud Practitioner (optional — skip if you know AWS basics)
    ↓
AWS Certified Data Engineer – Associate    ← primary target
    ↓
AWS Certified Solutions Architect – Associate (optional, broadens you)
    ↓
AWS Certified Machine Learning Engineer – Associate (optional, if ML track)
```

---

## AWS Certified Data Engineer – Associate (DEA-C01)

Launched 2023. Replaces the old Big Data Specialty as the main data engineering cert.

### What It Covers

| Domain | Weight |
|--------|--------|
| Data ingestion and transformation | 34% |
| Store and manage data | 26% |
| Data operations and support | 22% |
| Data security and governance | 18% |

**Core services tested:**
- S3 — storage classes, lifecycle, event notifications, encryption
- Glue — Data Catalog, ETL jobs, crawlers, job bookmarks
- Lake Formation — fine-grained permissions on S3/Glue Catalog
- Redshift — distribution keys, sort keys, COPY, Spectrum, Redshift Serverless
- EMR — cluster types, Spark, HDFS vs S3 storage
- Kinesis — Data Streams (shards, consumers), Firehose (delivery to S3/Redshift), Data Analytics
- Lambda — event-driven processing, S3 triggers
- Step Functions — orchestrating pipeline steps
- EventBridge — event routing between services
- Athena — serverless SQL on S3
- DMS — Database Migration Service for CDC

### Exam Format

- Duration: 170 minutes
- Questions: 65 (50 scored + 15 unscored)
- Passing score: 720/1000
- Cost: $150 USD
- Valid for: 3 years

### Key Topics to Focus On

**Kinesis — often tested:**
```
Kinesis Data Streams    → real-time event ingest, custom consumers, replay
    Shards: 1MB/s in, 2MB/s out per shard
    Retention: 1–365 days

Kinesis Data Firehose   → managed delivery to S3, Redshift, OpenSearch, Splunk
    No consumer code — Firehose handles buffering and delivery
    Buffer: size (1–128MB) or interval (60–900 seconds)

Kinesis Data Analytics  → real-time SQL or Apache Flink on Kinesis streams
```

**Glue job bookmarks — incremental processing:**
```python
# Job bookmarks track the last processed S3 path/offset
# Enable in Glue job config:
job.init(args['JOB_NAME'], args)
# Glue automatically skips already-processed files on next run
```

**Lake Formation vs S3 bucket policies:**
- S3 policies: bucket/object-level access (coarse)
- Lake Formation: table/column/row-level permissions on Glue Catalog tables
- Production: use Lake Formation for data lake governance

### Study Resources

| Resource | Cost | Notes |
|----------|------|-------|
| AWS Skill Builder — DEA-C01 course | Free | Official AWS content |
| Stephane Maarek's AWS courses (Udemy) | ~$15 | Best Udemy AWS instructor |
| TutorialsDojo practice exams | ~$15 | Most realistic practice questions |
| AWS free tier | Free | 12 months for many services |
| AWS Workshop Studio | Free | Hands-on labs by AWS |

### Sample Questions

**Q: You need to load 500GB of CSV files from S3 into Redshift as fast as possible. What do you use?**  
A: COPY command with parallel loading from S3. Split files so each Redshift node gets its own files to load in parallel.

**Q: Your Kinesis Data Stream is receiving 3MB/s but falling behind. What do you do?**  
A: Increase the number of shards. Each shard supports 1MB/s ingest — you need at least 3 shards for 3MB/s.

**Q: You want to query CSV files in S3 without loading them into Redshift. What service?**  
A: Amazon Athena — serverless SQL using Glue Data Catalog for schema, pay per TB scanned.

---

## AWS Solutions Architect – Associate (SAA-C03)

Not DE-specific but highly valuable — covers the broader AWS ecosystem that your pipelines run on (VPC, IAM, networking, availability).

- Duration: 130 minutes | Questions: 65 | Cost: $150 | Passing: 720/1000
- **Worth getting** if you're involved in infrastructure decisions or want to move into a senior/lead DE role on AWS

---

## Recommended Order for AWS

1. **DEA-C01** (Data Engineer Associate) — your primary cert
2. **SAA-C03** (Solutions Architect Associate) — optional, adds infra depth
3. **MLA-C01** (Machine Learning Engineer) — if ML is part of your role
