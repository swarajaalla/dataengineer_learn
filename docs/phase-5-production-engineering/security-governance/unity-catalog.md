---
sidebar_position: 1
---

# Unity Catalog

Unity Catalog is Databricks' centralized governance layer. It provides unified data access control, lineage, and auditing across all Databricks workspaces.

---

## Why Unity Catalog?

Before Unity Catalog:
- Each Databricks workspace had its own Hive metastore
- No cross-workspace data sharing
- Access control at cluster level — not table level
- No built-in lineage

With Unity Catalog:
- One catalog governs all workspaces
- Table-level and column-level access control
- Automatic data lineage
- Full audit log
- Row-level security and column masking

---

## Three-Level Namespace

```
catalog.schema.table

prod_catalog.silver.orders
    ↑           ↑      ↑
  catalog    schema   table
```

- **Catalog** — top-level container, usually environment (dev, prod) or domain
- **Schema** — groups related tables (bronze, silver, gold, or domain name)
- **Table** — the actual Delta or managed table

---

## Creating the Hierarchy

```sql
-- Create catalog
CREATE CATALOG IF NOT EXISTS prod_catalog;
USE CATALOG prod_catalog;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- Create table in Unity Catalog
CREATE TABLE silver.orders (
    order_id    STRING NOT NULL,
    customer_id STRING,
    amount      DECIMAL(18,2),
    order_date  DATE
) USING DELTA;
```

---

## Access Control

```sql
-- Grant access to a schema
GRANT USAGE ON CATALOG prod_catalog TO `analyst_group`;
GRANT USAGE ON SCHEMA prod_catalog.gold TO `analyst_group`;
GRANT SELECT ON ALL TABLES IN SCHEMA prod_catalog.gold TO `analyst_group`;

-- Grant access to a specific table
GRANT SELECT ON TABLE silver.orders TO `data_scientist@company.com`;

-- Grant write access (for engineers)
GRANT MODIFY ON TABLE silver.orders TO `de_team`;

-- Check what access a user has
SHOW GRANTS ON TABLE silver.orders;
```

---

## External Locations (Managed Identity Access)

Instead of mounts, Unity Catalog uses External Locations to access ADLS:

```sql
-- Create storage credential (managed identity)
CREATE STORAGE CREDENTIAL adls_credential
WITH AZURE_MANAGED_IDENTITY (
    connector_id = '/subscriptions/.../connectors/databricks'
);

-- Create external location
CREATE EXTERNAL LOCATION silver_location
URL 'abfss://silver@mystorageaccount.dfs.core.windows.net/'
WITH (STORAGE CREDENTIAL adls_credential);

-- Create external table using the location
CREATE TABLE silver.orders
USING DELTA
LOCATION 'abfss://silver@mystorageaccount.dfs.core.windows.net/orders/';
```

---

## Row-Level Security

Control what rows each user sees:

```sql
-- Create a row filter function
CREATE FUNCTION silver.filter_by_region(region STRING)
RETURN region = current_user() OR is_account_admin();

-- Apply row filter to table
ALTER TABLE silver.orders
SET ROW FILTER silver.filter_by_region ON (region);
```

---

## Column Masking

Mask PII for non-privileged users:

```sql
-- Create masking function
CREATE FUNCTION silver.mask_email(email STRING)
RETURN CASE WHEN is_member('pii_readers') THEN email ELSE '***@***.***' END;

-- Apply to column
ALTER TABLE silver.customers
ALTER COLUMN email SET MASK silver.mask_email;
```

---

## Data Lineage

Unity Catalog automatically tracks lineage — which tables were read to produce each table.

```python
# In Databricks — view lineage in the Data Explorer UI
# Or via REST API
```

In the Unity Catalog UI: click any table → Lineage tab → see upstream sources and downstream consumers.
