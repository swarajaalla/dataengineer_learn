---
sidebar_position: 3
---

# Ingestion Patterns

Choosing the right ingestion pattern determines pipeline cost, reliability, and how current your data is. Most companies use multiple patterns simultaneously.

---

## Pattern 1: Full Load

Copy the entire source dataset every time. No tracking what changed.

```
Source table (1M rows) → Extract ALL rows → Overwrite target
```

**When it works:**
- Small reference tables (country codes, product catalog under 100K rows)
- Source has no reliable delta column (`updated_at`, `created_at`)
- Data is small enough that full extract is fast (< 5 minutes)
- Source doesn't support CDC or change tracking

**When it's a problem:**
- Large tables (100M+ rows) — extract takes hours
- Source can't handle read load during business hours
- Network bandwidth is limited

**ADF implementation:**
```
Copy Activity → Source: SQL query (SELECT * FROM products)
             → Sink: ADLS Parquet (overwrite mode)
```

---

## Pattern 2: Incremental Load (Watermark-based)

Track the last loaded timestamp. Only extract records newer than that watermark.

```
Last watermark: 2024-01-14 23:59:59
Extract: SELECT * FROM orders WHERE modified_at > '2024-01-14 23:59:59'
Update watermark: set to MAX(modified_at) from this extract
```

**Requirements:** Source must have a reliable `updated_at` or `modified_at` column maintained by the source system.

**ADF implementation:**
```python
# ADF pipeline parameters:
# - watermark_table: Azure SQL table storing last run timestamps
# - pipeline_name: 'sap_orders'

# Step 1: Read last watermark from control table
SELECT last_watermark FROM pipeline_control WHERE pipeline_name = 'sap_orders'
# Returns: 2024-01-14 23:59:59

# Step 2: Extract delta
SELECT * FROM sap_orders 
WHERE last_changed_datetime > @last_watermark
  AND last_changed_datetime <= @current_run_time

# Step 3: Write to Bronze ADLS

# Step 4: Update watermark
UPDATE pipeline_control 
SET last_watermark = @current_run_time 
WHERE pipeline_name = 'sap_orders'
```

**Pitfall:** If `updated_at` is not reliably set by the source (human updates, batch jobs without trigger), records will be missed.

---

## Pattern 3: CDC (Change Data Capture)

Capture INSERT, UPDATE, DELETE operations from the source database's transaction log.

```
Source DB (SQL Server)
  → Transaction log → CDC connector (Debezium / ADF)
  → Change feed (ordered by time, includes before/after image)
  → Landing zone (Kafka or ADLS)
```

More reliable than watermark-based — catches every change including deletes.

See the [CDC page](./cdc) for full detail.

---

## Pattern 4: File Drop (SFTP / Blob Event)

Source system deposits files to a location on a schedule. Pipeline detects and processes them.

```
Source system writes: /incoming/orders_20240115.csv (SFTP or Blob)
  → Event Grid detects new file
  → ADF trigger fires
  → Copy Activity: SFTP → ADLS Bronze
  → Databricks job: process new file
```

**ADF Event Trigger:**
```json
{
  "type": "BlobEventsTrigger",
  "blobPathBeginsWith": "/bronze/incoming/sftp/",
  "events": ["Microsoft.Storage.BlobCreated"]
}
```

**Challenge:** Files arrive late, out of order, or with the same name (overwrites). Build idempotency: check if file already processed before running.

---

## Pattern 5: Push (Webhook / Event-Driven)

Source system sends data to your endpoint when something happens.

```
Source system: order placed → POST to https://your-function.azurewebsites.net/ingest
  → Azure Function receives → writes to Event Hub
  → Databricks Structured Streaming → Delta Bronze
```

**When to use:** Source can push, latency requirement is seconds, no polling overhead.

**Azure Function HTTP trigger:**
```python
import azure.functions as func
import json

def main(req: func.HttpRequest, outputEventHub: func.Out[str]) -> func.HttpResponse:
    event = req.get_json()
    outputEventHub.set(json.dumps(event))
    return func.HttpResponse("OK", status_code=200)
```

---

## Pattern 6: Multi-Source Fan-In

Many sources → one landing zone, same format.

```
SAP Sales Orders     ──┐
Salesforce Accounts  ──┤→ ADF ForEach pipeline → ADLS Bronze
Dynamics Invoices    ──┤   (same Copy Activity, parameterized)
SFTP Files           ──┘
```

**ADF implementation:** Store source configurations in a metadata table. ForEach activity iterates and runs a parameterized Copy Activity for each source.

```sql
-- Metadata table
CREATE TABLE ingestion_config (
    source_name     VARCHAR(100),
    source_type     VARCHAR(50),  -- 'sql', 'rest_api', 'sftp'
    source_query    VARCHAR(MAX),
    target_path     VARCHAR(500),
    watermark_col   VARCHAR(100),
    is_active       BIT
);
```

---

## Choosing the Right Pattern

| Source characteristic | Recommended pattern |
|----------------------|-------------------|
| Small table, no delta column | Full load |
| Large table with `updated_at` | Incremental (watermark) |
| Need to capture deletes | CDC |
| Source drops files on schedule | File drop |
| Source can push in real-time | Push / webhook |
| Many similar sources | Multi-source fan-in |
