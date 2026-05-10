---
sidebar_position: 3
---

# Types of Data

Understanding what kind of data you're working with determines which tools, storage systems, and processing patterns you choose. Getting this wrong early creates expensive rework.

---

## Structured vs Semi-structured vs Unstructured

| Type | Definition | Examples | Storage | Tools |
|------|-----------|---------|---------|-------|
| **Structured** | Fixed schema, rows and columns | Database tables, CSV exports, Excel | SQL DB, Synapse, Snowflake | SQL, Spark SQL |
| **Semi-structured** | Flexible schema, self-describing | JSON, XML, Avro, Parquet | ADLS, S3, Cosmos DB | Spark, Python |
| **Unstructured** | No schema | Images, PDFs, audio, video, emails | Blob storage, S3 | ML models, custom parsers |

Most data engineering work is structured and semi-structured. Unstructured data typically involves ML engineering, not DE.

---

## Structured Data: The Reliable Workhorse

Comes from operational databases and ERP systems (SAP, Dynamics, Oracle).

```sql
-- Clean, typed, predictable
SELECT customer_id, order_date, order_total
FROM orders
WHERE order_date >= '2024-01-01'
```

**In Azure:** Lands in ADLS as Parquet or gets copied to Synapse/Databricks SQL.

---

## Semi-structured Data: The Reality of Modern Pipelines

APIs, event streams, and NoSQL databases produce semi-structured data. Schema is embedded in the data itself.

```json
// REST API response — nested, flexible, no guarantee of field presence
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
  "metadata": {"source": "web", "campaign": null}
}
```

**Challenge:** `lineItems` is an array — you need to `explode()` it in Spark before you can aggregate.

---

## Hot / Warm / Cold Data Tiers

| Tier | Access frequency | Latency needed | Cost | Azure storage |
|------|-----------------|----------------|------|---------------|
| **Hot** | Constantly | Milliseconds | High | Azure SQL, Cosmos DB |
| **Warm** | Daily/weekly | Seconds | Medium | ADLS Hot tier, Databricks |
| **Cold** | Rarely (archive) | Minutes/hours | Low | ADLS Archive tier, Azure Blob Cold |

**Rule:** Move data to colder tiers as it ages. Raw source files older than 90 days don't need hot access.

```
Bronze (raw landing)    → ADLS Hot (active ingestion window)
                        → ADLS Cool (after 30 days)
                        → ADLS Archive (after 1 year)
```

---

## Transactional vs Analytical Data

| | Transactional | Analytical |
|--|--------------|-----------|
| **Purpose** | Record business events | Answer business questions |
| **Updates** | Frequent inserts/updates/deletes | Mostly reads, batch writes |
| **Schema** | Normalized (avoid duplication) | Denormalized (fast reads) |
| **Latency** | Real-time | Minutes to hours acceptable |
| **Example** | SAP order insert | Monthly sales by region |

The job of the data pipeline is to convert transactional data into analytical data.

---

## Master Data, Reference Data, Event Data

These three categories often get mixed up:

**Master Data** — core business entities, changes slowly
- Customers, products, employees, suppliers
- Example: `dim_customer` table in your warehouse
- Maintained in MDM systems (SAP MDG, Informatica MDM)

**Reference Data** — lookup values, rarely changes
- Country codes, currency codes, department mappings, product categories
- Example: `ref_currency`, `ref_country_code`
- Usually loaded once and referenced everywhere

**Event Data** — things that happened, append-only
- Orders placed, clicks, sensor readings, payments
- Example: `fact_orders`, `event_clickstream`
- Always growing, partitioned by date for performance

---

## Real Azure Data Landing by Type

```
Source: SAP ERP
├── Master data (customers, products)     → ADLS/Bronze → Silver dim tables
├── Transactional data (orders, invoices) → ADLS/Bronze → Silver/Gold fact tables
└── Reference data (plant codes, UoM)     → Azure SQL (reference DB) or Delta ref tables

Source: Salesforce API (JSON)
└── Semi-structured events                → ADLS/Bronze (JSON) → flatten → Silver Delta

Source: IoT sensors
└── Event stream                          → Event Hub → Structured Streaming → Delta Bronze

Source: SharePoint/email reports
└── Unstructured (PDFs)                   → Blob Storage → AI processing → extracted fields
```
