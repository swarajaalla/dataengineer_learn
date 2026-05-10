---
sidebar_position: 4
---

# Managed Identity & Security in Azure

Managed Identity is the correct way to authenticate between Azure services. It eliminates service principal secrets from your code and config files.

---

## What Is Managed Identity?

Azure automatically creates and rotates a service identity for your resource. You assign RBAC roles to that identity — no passwords, no secrets, no rotation scripts.

```
Databricks Workspace → has a System-Assigned Managed Identity
→ You grant that identity "Storage Blob Data Contributor" on ADLS
→ Databricks reads/writes ADLS with no credentials in code
```

**Two types:**
- **System-assigned** — tied to one resource, deleted when resource is deleted
- **User-assigned** — standalone identity, can be assigned to multiple resources

---

## RBAC Roles for Data Engineering

| Role | Scope | Used For |
|------|-------|----------|
| Storage Blob Data Contributor | Storage Account | Read + write blobs |
| Storage Blob Data Reader | Storage Account | Read-only access |
| Key Vault Secrets User | Key Vault | Read secrets |
| Databricks Contributor | Databricks Workspace | Deploy jobs via CI/CD |
| Data Factory Contributor | ADF | Deploy pipelines via CI/CD |

```bash
# Assign role via Azure CLI
az role assignment create \
    --assignee <managed-identity-object-id> \
    --role "Storage Blob Data Contributor" \
    --scope "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>"
```

---

## Azure Key Vault — Storing Secrets

Key Vault is where ALL secrets live. Managed identities read from Key Vault — nothing is hardcoded.

```python
# In Databricks — read secret from Key Vault-backed secret scope
client_id = dbutils.secrets.get(scope="kv-scope", key="sp-client-id")
client_secret = dbutils.secrets.get(scope="kv-scope", key="sp-client-secret")

# Secret never appears in logs or notebook output
```

Set up the secret scope once:
```bash
databricks secrets create-scope --scope kv-scope \
    --scope-backend-type AZURE_KEYVAULT \
    --resource-id /subscriptions/.../vaults/mykeyvault \
    --dns-name https://mykeyvault.vault.azure.net/
```

---

## Unity Catalog — Storage Credentials & External Locations

With Unity Catalog, access to ADLS is defined at the metastore level:

```sql
-- Create a storage credential (references a managed identity or service principal)
CREATE STORAGE CREDENTIAL adls_credential
    WITH AZURE_MANAGED_IDENTITY = '/subscriptions/.../managedIdentities/uc-identity';

-- Create an external location that uses the credential
CREATE EXTERNAL LOCATION bronze_location
    URL 'abfss://bronze@mystorageaccount.dfs.core.windows.net/'
    WITH (STORAGE CREDENTIAL adls_credential);

-- Now tables can be created on this location
CREATE TABLE catalog.schema.orders
    LOCATION 'abfss://bronze@mystorageaccount.dfs.core.windows.net/orders/';
```

---

## Security Hierarchy

```
Azure Active Directory / Entra ID
    └── Managed Identities / Service Principals
        └── RBAC on Azure Resources (Storage, Key Vault, etc.)
            └── Databricks Unity Catalog
                └── Catalog / Schema / Table / Column level permissions
                    └── Row-level security via dynamic views
```

---

## What to Avoid

- Never use storage account keys in notebooks or ADF linked services
- Never commit `.env` files with client secrets to Git
- Never use SAS tokens long-term — they don't rotate automatically
- Don't give `Owner` or `Contributor` at subscription level — use least privilege
