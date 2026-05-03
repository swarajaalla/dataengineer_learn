# SAP to Databricks Unity Catalog Migration

## Overview

This project involved migrating enterprise data pipelines from legacy systems into a modern data platform using Azure and Databricks.

The key objective was to:
- Centralize data governance
- Improve pipeline reliability
- Enable scalable data processing

---

## Problem Statement

The existing system had multiple issues:

- Data stored across fragmented systems
- No centralized governance
- Limited visibility into data lineage
- Manual ingestion processes
- Security and access control challenges

👉 Impact:
- Difficult to track data usage
- High maintenance effort
- Risk of data inconsistencies

---

## Architecture Before Migration

- Source: SAP + CSV files
- Processing: Legacy pipelines
- Storage: Hive Metastore
- Limited governance and lineage

Tech Stack : 
Azure Data Factory
Azure Data Lake Storage (ADLS)
Databricks (Delta Lake)
Unity Catalog

<div style={{textAlign: 'center'}}>
<img src="\img\ELGi POC Architecture.png" width="700" />

</div>

---

## Target Architecture

SAP / CSV → ADF → ADLS → Databricks → Unity Catalog → BI

Key components:
- Azure Data Factory (ADF) for ingestion
- Azure Data Lake Storage (ADLS) for storage
- Databricks for transformation
- Unity Catalog for governance

---

## Key Challenges

### 1. Migration from Hive Metastore to Unity Catalog

- Tables tightly coupled with legacy structure
- No direct automated migration for curated datasets

---

### 2. Data Consistency

- Ensuring no data loss during migration
- Schema mismatches across environments

---

### 3. Access Control

- Moving from basic permissions to fine-grained governance

---

### 4. Pipeline Reliability

- Existing pipelines lacked proper logging and validation

---

## Solution Approach

### Step 1: Recreate Schema in Unity Catalog

- Created schemas manually using DDL scripts
- Ensured naming consistency and structure alignment

---

### Step 2: Attach Existing Delta Tables

Used external table approach:

```sql
CREATE TABLE catalog.schema.table
USING DELTA
LOCATION '/mnt/adls/path/to/data';
```
---

### Step 3: Data Validation
Record count comparison
Schema validation
Sample data checks

### Step 4: Pipeline Refactoring
Built reusable ingestion framework in ADF
Parameterized pipelines for multiple sources
Added logging and error handling
### Step 5: Governance with Unity Catalog
Defined catalogs and schemas
Implemented role-based access control (RBAC)
Enabled data lineage tracking

## Key Design Decisions
1.Why not full data reload?
- High cost 
- Time-consuming
- Risk of downtime

👉 Instead:
Used external table mapping with Delta files

2.Why parameterized pipelines?
- Reduced duplication
- Easier maintenance
- Scalable ingestion for multiple datasets

## Results & Impact
- Reduced manual effort by ~80%
- Improved data governance and security
- Established clear data lineage
- Faster onboarding of new datasets
- More reliable pipelines with better monitoring
## What I Learned
- Governance is as important as data processing
- Migration is more about planning than execution
- Small design decisions (like table structure) have long-term impact
## What I Would Improve
- Automate validation checks further
- Introduce data quality framework earlier
- Add monitoring dashboards for pipelines
## Key Takeaways
- Unity Catalog is critical for enterprise-grade governance
- Avoid full reloads when working with large datasets
- Build reusable frameworks early
- Always validate data after migration
