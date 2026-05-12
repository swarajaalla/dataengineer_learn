---
sidebar_position: 3
---

# Managed Identity, RBAC & Security Controls in Azure

Security is one of the most critical parts of Azure Data Engineering.

Modern Azure architectures should:
- Avoid hardcoded secrets
- Avoid public access
- Use identity-based authentication
- Follow least privilege access
- Centralize secrets securely
- Enable auditing and governance

Core Azure security building blocks:
- Managed Identity
- RBAC
- Azure Key Vault
- Private Endpoints
- Unity Catalog
- Encryption
- Network Isolation

---

# Why Security Matters in Data Engineering

Data platforms contain:
- Customer data
- Financial records
- PII
- Business-critical analytics

Poor security leads to:
- Data breaches
- Compliance violations
- Credential leaks
- Unauthorized access
- Lateral movement attacks

---

# Core Azure Security Architecture

```text
Microsoft Entra ID (Azure AD)
            ↓
Managed Identity / Service Principal
            ↓
RBAC Permissions
            ↓
Azure Resources
    ├── ADLS
    ├── Key Vault
    ├── Databricks
    ├── Synapse
    └── SQL Database
            ↓
Unity Catalog / Table-Level Security
```

---

# Microsoft Entra ID (Azure AD)

Identity provider for Azure.

Handles:
- Authentication
- Authorization
- User identities
- Service identities
- Groups
- MFA policies

Everything in Azure security starts with:
```text
Entra ID
```

---

# What Is Managed Identity?

Managed Identity is an Azure-managed service identity automatically created for Azure resources.

Instead of storing:
- Username
- Password
- Client secret

Azure handles authentication automatically.

---

# Why Managed Identity?

Benefits:
- No secret rotation
- No passwords in code
- Automatic credential management
- More secure
- Better governance

---

# Managed Identity Flow

```text
Databricks Workspace
        ↓
Managed Identity
        ↓
RBAC Permission
        ↓
ADLS / Key Vault / Synapse
```

No secrets required.

---

# Types of Managed Identity

| Type | Description |
|---|---|
| System-Assigned | Tied to a single Azure resource |
| User-Assigned | Reusable standalone identity |

---

# System-Assigned Managed Identity

Automatically created for a resource.

Characteristics:
- One-to-one relationship
- Deleted with resource
- Easy to manage

Example:
```text
ADF Workspace → Managed Identity
```

---

# User-Assigned Managed Identity

Standalone reusable identity.

Advantages:
- Shared across resources
- Centralized identity management
- Easier enterprise governance

Example:
```text
Single Identity
    ↓
ADF + Databricks + Synapse
```

---

# Managed Identity vs Service Principal

| Managed Identity | Service Principal |
|---|---|
| Azure-managed | User-managed |
| No secret rotation | Requires secret/certificate rotation |
| More secure | Higher operational overhead |
| Preferred in Azure | Used for external/cross-tenant cases |

---

# When Service Principals Are Still Needed

Use Service Principals when:
- Cross-tenant access required
- External applications connect
- CI/CD outside Azure
- Non-Azure systems authenticate

Otherwise:
```text
Prefer Managed Identity
```

---

# Role-Based Access Control (RBAC)

RBAC controls:
```text
WHO can do WHAT on WHICH resource
```

---

# RBAC Scope Hierarchy

```text
Management Group
    ↓
Subscription
    ↓
Resource Group
    ↓
Resource
```

Permissions inherit downward.

---

# Common RBAC Roles in Data Engineering

| Role | Usage |
|---|---|
| Storage Blob Data Reader | Read-only access to ADLS |
| Storage Blob Data Contributor | Read/write ADLS access |
| Key Vault Secrets User | Read secrets |
| Contributor | Manage resources |
| Reader | Read resource metadata |
| Synapse Contributor | Manage Synapse |
| Data Factory Contributor | Manage ADF |
| Databricks Contributor | Manage Databricks |

---

# RBAC Best Practice

Always follow:
```text
Least Privilege Principle
```

Give only required access.

Avoid:
```text
Owner
Contributor at Subscription Level
```

unless absolutely necessary.

---

# Example RBAC Assignment

```bash
az role assignment create \
    --assignee <managed-identity-object-id> \
    --role "Storage Blob Data Contributor" \
    --scope "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>"
```

---

# Common RBAC Design Pattern

```text
ADF Managed Identity
        ↓
Storage Blob Data Contributor
        ↓
ADLS Bronze Container
```

---

# Azure Key Vault

Azure Key Vault securely stores:
- Passwords
- Secrets
- Certificates
- Keys
- Connection strings

---

# Why Key Vault?

Never store secrets in:
- Notebooks
- Pipelines
- Git repositories
- Config files

Use:
```text
Key Vault
```

instead.

---

# Key Vault Integration with Databricks

```python
client_id = dbutils.secrets.get(
    scope="kv-scope",
    key="sp-client-id"
)

client_secret = dbutils.secrets.get(
    scope="kv-scope",
    key="sp-client-secret"
)
```

Secrets never appear in logs/output.

---

# Databricks Secret Scope

```bash
databricks secrets create-scope \
    --scope kv-scope \
    --scope-backend-type AZURE_KEYVAULT \
    --resource-id /subscriptions/.../vaults/mykeyvault \
    --dns-name https://mykeyvault.vault.azure.net/
```

---

# Common Key Vault Problem

## Error
```text
Forbidden
Access Denied
```

## Root Cause
Missing RBAC or access policy.

## Solution
Grant:
```text
Key Vault Secrets User
```

role to Managed Identity.

---

# Security in Azure Data Factory

ADF uses Managed Identity for:
- ADLS access
- Key Vault access
- SQL access

Best practice:
```text
ADF Linked Service → Managed Identity
```

instead of:
```text
Username + Password
```

---

# Security in ADLS Gen2

Security layers:
- RBAC
- ACLs
- Firewall
- Private Endpoint
- Encryption

---

# RBAC vs ACLs

| RBAC | ACL |
|---|---|
| Resource-level access | File/folder-level access |
| Managed via Azure | POSIX-style permissions |
| Coarse-grained | Fine-grained |

---

# ACL Example

```text
rwx
```

Permissions:
- Read
- Write
- Execute

Applied to:
- Folders
- Files

---

# Encryption in Azure

Azure supports:
- Encryption at rest
- Encryption in transit

Default encryption:
```text
AES-256
```

---

# Customer Managed Keys (CMK)

By default:
```text
Microsoft-managed keys
```

For higher security:
```text
Customer-managed keys via Key Vault
```

Used in:
- Banking
- Healthcare
- Highly regulated industries

---

# Network-Level Security Controls

Security is not only identity-based.

Also use:
- Private Endpoints
- Firewalls
- VNets
- NSGs

---

# Private Endpoints

Creates private IP access to:
- ADLS
- Key Vault
- Synapse
- SQL DB

Avoids public internet exposure.

---

# Storage Firewall

Restrict storage access to:
- Approved VNets
- Approved IPs
- Private Endpoints

Example:
```text
Default Action = Deny
```

---

# Unity Catalog Security

Unity Catalog provides:
- Central governance
- Fine-grained permissions
- Data lineage
- Auditing

---

# Unity Catalog Hierarchy

```text
Metastore
    ↓
Catalog
    ↓
Schema
    ↓
Table
    ↓
Column
```

---

# Storage Credentials in Unity Catalog

```sql
CREATE STORAGE CREDENTIAL adls_credential
WITH AZURE_MANAGED_IDENTITY =
'/subscriptions/.../managedIdentities/uc-identity';
```

---

# External Locations

```sql
CREATE EXTERNAL LOCATION bronze_location
URL 'abfss://bronze@mystorageaccount.dfs.core.windows.net/'
WITH (STORAGE CREDENTIAL adls_credential);
```

---

# Row-Level Security

Restrict rows dynamically.

Example:
```text
India users → only India records
US users → only US records
```

Implemented using:
- Dynamic views
- SQL filtering

---

# Column-Level Security

Hide sensitive columns:
- SSN
- Salary
- Credit card number

Example:
```text
Mask salary column for analysts
```

---

# Data Masking

Protect sensitive information.

Techniques:
- Partial masking
- Hashing
- Tokenization

---

# Auditing & Monitoring

Monitor:
- Login attempts
- Data access
- Permission changes
- Failed authentications

---

# Azure Monitor & Log Analytics

Used for:
- Security auditing
- Alerting
- Log retention
- Threat investigation

---

# Microsoft Defender for Cloud

Provides:
- Threat detection
- Security recommendations
- Vulnerability assessment
- Compliance monitoring

---

# Common Security Problems

# 1. Hardcoded Secrets

## Bad Practice

```python
password = "admin123"
```

## Correct Approach

```text
Key Vault + Managed Identity
```

---

# 2. Over-Permissioned Access

## Problem
Everyone has Contributor access.

## Risk
Accidental deletion or security breach.

## Fix
Use least privilege RBAC.

---

# 3. Public Storage Accounts

## Problem
ADLS exposed publicly.

## Fix
- Disable public access
- Use Private Endpoints
- Enable firewall restrictions

---

# 4. Expired Service Principal Secrets

## Symptoms
Pipelines suddenly fail.

## Fix
- Rotate secrets
- Prefer Managed Identity

---

# 5. Missing Unity Catalog Governance

## Problem
No centralized access control.

## Fix
Implement:
- Unity Catalog
- External Locations
- Storage Credentials

---

# Common Enterprise Security Pattern

```text
Entra ID
    ↓
Managed Identity
    ↓
RBAC Permissions
    ↓
Private Endpoint
    ↓
ADLS / Key Vault
    ↓
Unity Catalog Governance
```

---

# Security Best Practices

- Use Managed Identity whenever possible
- Avoid storage account keys
- Store secrets only in Key Vault
- Follow least privilege RBAC
- Disable public network access
- Use Private Endpoints
- Enable auditing and monitoring
- Use Unity Catalog for governance
- Rotate Service Principal secrets regularly
- Use Customer Managed Keys for sensitive workloads

---

# Common Interview Questions

## Difference Between Managed Identity and Service Principal

| Managed Identity | Service Principal |
|---|---|
| Azure-managed | User-managed |
| No secrets | Uses secrets/certificates |
| Preferred in Azure | Needed for external access |

---

## Difference Between RBAC and ACLs

| RBAC | ACL |
|---|---|
| Resource-level | File/folder-level |
| Azure IAM-based | POSIX-style |
| Coarse-grained | Fine-grained |

---

## Why Is Managed Identity Better?

Because:
- No credential rotation
- No secret exposure
- Lower operational overhead
- Better security posture

---

# Key Takeaways

- Managed Identity is the preferred Azure authentication mechanism.
- RBAC controls resource-level permissions.
- Key Vault securely stores secrets and keys.
- Private Endpoints secure network access.
- Unity Catalog enables centralized governance.
- Least privilege access is critical.
- Most enterprise security issues come from over-permissioning or exposed secrets.