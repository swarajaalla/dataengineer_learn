---
sidebar_position: 4
---

# Databases & ACID

ACID is the set of properties that guarantee database transactions are processed reliably. In data engineering, understanding ACID is critical because pipelines write data, and writes can fail halfway through.

---

## ACID Properties

### A — Atomicity
A transaction is all-or-nothing. Either every operation succeeds, or none of them do.

```sql
-- This entire block succeeds or rolls back together
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 1000 WHERE id = 'A';
  UPDATE accounts SET balance = balance + 1000 WHERE id = 'B';
COMMIT;
```

If the second `UPDATE` fails, the first one is rolled back. No partial state.

**In data pipelines:** If your Databricks job writes 80% of records to a Delta table then crashes, ACID ensures the table still contains its previous complete state — not 80% of the new data.

---

### C — Consistency
Data must always move from one valid state to another. Business rules and constraints are enforced.

```sql
-- Constraint: balance cannot go negative
ALTER TABLE accounts ADD CONSTRAINT balance_positive CHECK (balance >= 0);

-- This transaction fails entirely if it would violate the constraint
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 5000 WHERE id = 'A'; -- balance is 1000 → violates
COMMIT; -- rolled back, balance stays at 1000
```

---

### I — Isolation
Concurrent transactions don't interfere with each other. Each sees a consistent snapshot.

| Isolation Level | What you see during another transaction |
|----------------|----------------------------------------|
| **Read Uncommitted** | Dirty reads — can see uncommitted changes |
| **Read Committed** | Only sees committed data (default in most DBs) |
| **Repeatable Read** | Same query returns same results within transaction |
| **Serializable** | Full isolation — transactions appear sequential |

**In Databricks / Delta Lake:** Snapshot isolation by default. A reader always sees the last committed version of the table, even while a writer is updating it.

---

### D — Durability
Once committed, data survives crashes. It's on disk, not just memory.

If the database crashes right after `COMMIT`, the data is still there when it restarts. Achieved through write-ahead logs (WAL) and transaction logs.

---

## Why ACID Matters in Data Pipelines

**Without ACID (plain Parquet files):**
```
Pipeline writes 10M rows across 200 Parquet files
→ Fails at file 150
→ Table now has 150 new files + 50 old files
→ Downstream reads get mixed old/new data
→ Query results are wrong
→ No way to know which files are good
```

**With ACID (Delta Lake):**
```
Pipeline writes 10M rows across 200 Parquet files
→ Fails at file 150
→ Delta transaction log has NOT committed this write
→ Table still shows previous complete state
→ Re-run the pipeline — it writes cleanly
→ Readers never see partial data
```

---

## BASE: The Alternative to ACID

Distributed NoSQL systems (Cosmos DB, DynamoDB, Cassandra) often use BASE instead:

| | ACID | BASE |
|--|------|------|
| **Stands for** | Atomicity, Consistency, Isolation, Durability | Basically Available, Soft state, Eventually consistent |
| **Consistency** | Strong — always consistent | Eventual — may be stale temporarily |
| **Availability** | May sacrifice availability for consistency | Always available (even if stale) |
| **Use case** | Transactions, finance, order systems | High-scale read/write, distributed, geo-replicated |

BASE is a trade-off: you get higher availability and performance at the cost of guaranteed consistency. Acceptable for social feeds, shopping carts, IoT metadata — not acceptable for financial records.

---

## Delta Lake: ACID on a Data Lake

Delta Lake adds a `_delta_log/` folder to Parquet files. This transaction log records every commit:

```
_delta_log/
  00000000000000000000.json  ← what files were added/removed in this commit
  00000000000000000001.json
  00000000000000000002.json
  00000000000000000010.checkpoint.parquet  ← periodic checkpoint for performance
```

Each commit in the log is **atomic** — either the whole write is recorded or it's not.

**Result:** ACID transactions on object storage (ADLS, S3, GCS). No database server needed.

---

## ACID in Action: Databricks MERGE

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/mnt/silver/customers")

# MERGE is atomic — either all matches update + inserts happen, or nothing
delta_table.alias("target").merge(
    source_df.alias("source"),
    "target.customer_id = source.customer_id"
).whenMatchedUpdateAll(
).whenNotMatchedInsertAll(
).execute()
```

If this MERGE crashes halfway through, Delta rolls back. The table stays clean.

---

## Common Real-World Failure: Partial Write Without ACID

```
Scenario: ADF copies 50 CSV files to ADLS. Job fails at file 30.
Result without ACID: 30 files landed, 20 missing. 
- Query returns partial data
- No error — just silent wrong results
- You discover the issue when the business escalates

Fix: Use Delta format. Run the Databricks copy with MERGE.
If it fails, re-run. Delta handles the duplicate-prevention via MERGE logic.
```
