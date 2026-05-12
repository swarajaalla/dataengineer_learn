---
sidebar_position: 2
---

# Azure Networking for Data Engineering

Azure Networking controls how Azure services communicate securely with:
- Each other
- On-premise systems
- External systems
- Users

In enterprise data engineering projects, networking is critical because:
- Data is sensitive
- Public internet exposure is risky
- Compliance requirements exist
- Services must communicate privately

Production environments should avoid exposing:
- ADLS
- Databricks
- Synapse
- Key Vault
- SQL databases

to the public internet whenever possible.

---

# Why Networking Matters in Data Engineering

Without proper networking:
- Data leaks become possible
- Unauthorized access can happen
- Pipelines fail due to blocked traffic
- Security audits fail
- Latency increases
- Compliance requirements are violated

---

# Core Networking Concepts

| Concept | Description |
|---|---|
| VNet | Private network inside Azure |
| Subnet | Smaller network segment inside a VNet |
| NSG | Firewall rules controlling traffic |
| Private Endpoint | Private IP for Azure PaaS services |
| Private Link | Underlying technology behind Private Endpoints |
| Service Endpoint | Secure subnet-to-service connectivity |
| VNet Peering | Connect multiple VNets privately |
| VPN Gateway | Secure tunnel from on-prem to Azure |
| ExpressRoute | Dedicated private enterprise connection |
| DNS | Resolves service names to private/public IPs |
| NAT Gateway | Outbound internet access with static IP |
| Bastion | Secure VM access without public IP |

---

# High-Level Azure Data Engineering Network Architecture

```text
Corporate Network (On-Prem)
            ↓
     ExpressRoute / VPN
            ↓
        Azure VNet
            ├── Databricks Subnets
            ├── Private Endpoint Subnet
            ├── SHIR Subnet
            ├── App Subnet
            └── Monitoring Subnet
                    ↓
            ADLS / Key Vault / Synapse
```

---

# Virtual Network (VNet)

A VNet is a private network inside Azure.

Used to:
- Isolate resources
- Control traffic
- Enable private communication

Example:
```text
10.0.0.0/16
```

---

# Subnets

Subnets divide VNets into smaller logical networks.

Example:

```text
VNet: 10.0.0.0/16

Subnets:
10.0.1.0/24 → Databricks Public
10.0.2.0/24 → Databricks Private
10.0.3.0/24 → Private Endpoints
10.0.4.0/24 → SHIR VM
```

---

# Typical Enterprise Network Layout

```text
Azure VNet
│
├── databricks-public
├── databricks-private
├── private-endpoints
├── integration-runtime
├── monitoring
└── shared-services
```

---

# Private Endpoint

A Private Endpoint gives Azure PaaS services a private IP inside your VNet.

Supported services:
- ADLS
- Key Vault
- Synapse
- SQL Database
- Event Hub
- Cosmos DB

---

# Why Private Endpoints?

Without Private Endpoint:

```text
Databricks → Public Internet → ADLS
```

With Private Endpoint:

```text
Databricks → Azure Backbone Network → ADLS
```

Benefits:
- No internet exposure
- Better security
- Lower attack surface
- Enterprise compliance

---

# ADLS Private Endpoint Example

```bash
az network private-endpoint create \
    --name pe-adls-dfs \
    --resource-group my-rg \
    --vnet-name my-vnet \
    --subnet services \
    --private-connection-resource-id /subscriptions/.../storageAccounts/mystorageaccount \
    --group-id dfs \
    --connection-name conn-adls-dfs
```

---

# Important ADLS Endpoints

| Endpoint | Usage |
|---|---|
| blob | Blob operations |
| dfs | Data Lake filesystem operations |

For ADLS Gen2:
```text
dfs endpoint is mandatory
```

---

# DNS Resolution in Private Networking

Critical concept many engineers miss.

Normally:

```text
mystorageaccount.dfs.core.windows.net
        ↓
Public IP
```

With Private Endpoint:

```text
mystorageaccount.dfs.core.windows.net
        ↓
Private IP (10.x.x.x)
```

This requires:
- Private DNS Zones
- Correct DNS linking

---

# Common DNS Problem

## Issue
Private Endpoint created but connectivity still fails.

## Root Cause
DNS still resolves to public IP.

## Solution
- Configure Private DNS Zone
- Link VNet to DNS zone
- Verify using:

```bash
nslookup mystorageaccount.dfs.core.windows.net
```

Should resolve to:
```text
10.x.x.x
```

not public IPs.

---

# Network Security Group (NSG)

NSG acts like a firewall.

Controls:
- Inbound traffic
- Outbound traffic

Applied to:
- Subnets
- NICs

---

# Typical NSG Rules

```text
Allow:
- Azure Storage
- Azure Key Vault
- Azure Active Directory
- Databricks Control Plane

Deny:
- Unknown internet traffic
```

---

# Enterprise NSG Pattern

```text
Allow outbound → AzureStorage
Allow outbound → AzureKeyVault
Allow outbound → AzureActiveDirectory
Allow outbound → Databricks Control Plane
Deny outbound → Internet
```

---

# Databricks VNet Injection

By default:
```text
Databricks runs in Microsoft-managed VNet
```

With VNet Injection:
```text
Databricks clusters deploy into YOUR VNet
```

---

# Why VNet Injection?

Required for:
- Private Endpoint access
- Enterprise security
- On-prem connectivity
- Custom NSG rules
- Private networking

---

# Databricks Subnets

Databricks requires:
- Public subnet
- Private subnet

Example:

```text
10.0.1.0/24 → Public
10.0.2.0/24 → Private
```

---

# Common Databricks Networking Issue

## Problem
Cluster starts but cannot access ADLS.

## Root Cause
- Missing Private Endpoint
- NSG blocking traffic
- DNS misconfiguration

## Solution
Verify:
- NSG outbound rules
- DNS resolution
- Storage firewall
- Managed Identity permissions

---

# Service Endpoints vs Private Endpoints

| Service Endpoint | Private Endpoint |
|---|---|
| Extends subnet identity | Creates private IP |
| Still public endpoint | Fully private access |
| Simpler setup | More secure |
| Less isolation | Better enterprise security |

Modern enterprise preference:
```text
Private Endpoint
```

---

# VPN Gateway

Creates encrypted tunnel between:
- Azure
- On-prem network

Used when:
- SAP systems are on-prem
- SQL Servers are on-prem
- Corporate systems are private

---

# ExpressRoute

Dedicated private connection to Azure.

Advantages:
- Lower latency
- Higher reliability
- Better security
- No internet routing

Common in large enterprises.

---

# Self-Hosted Integration Runtime (SHIR)

ADF cannot directly access private on-prem systems.

SHIR solves this.

Architecture:

```text
ADF (Azure)
      ↓
SHIR VM
      ↓
SAP / SQL Server / Oracle
```

---

# When SHIR Is Required

| Source Type | SHIR Needed? |
|---|---|
| On-prem SQL Server | Yes |
| SAP ECC | Yes |
| Oracle On-prem | Yes |
| Azure SQL DB | No |
| ADLS | No |

---

# Storage Firewall

ADLS firewall restricts who can access storage.

Example:

```json
{
  "networkAcls": {
    "defaultAction": "Deny"
  }
}
```

Only allowed:
- Approved VNets
- Approved IPs
- Private Endpoints

---

# Common Storage Firewall Problem

## Error
```text
403 Forbidden
AuthorizationFailure
```

## Possible Causes
- Missing firewall rule
- Missing RBAC
- Wrong subnet
- DNS issue

## Fix
Check:
- Storage firewall
- Managed Identity role
- Private Endpoint approval
- DNS resolution

---

# Managed Private Endpoints in Synapse

Synapse uses:
```text
Managed Private Endpoints
```

to securely connect to:
- ADLS
- SQL DB
- Cosmos DB

without public internet access.

---

# VNet Peering

Connects two VNets privately.

Example:
```text
Data VNet ↔ Shared Services VNet
```

Used when:
- Multiple teams/projects exist
- Shared networking architecture exists

---

# NAT Gateway

Provides:
- Controlled outbound internet
- Static outbound IP

Useful for:
- Whitelisting
- External APIs
- Vendor systems

---

# Azure Bastion

Secure VM access without public IPs.

Instead of:
```text
RDP/SSH over internet
```

Use:
```text
Browser → Bastion → VM
```

---

# Monitoring Network Traffic

## NSG Flow Logs
Capture traffic logs.

Useful for:
- Troubleshooting
- Security audits
- Traffic analysis

---

# Log Analytics

Central monitoring platform.

Used for:
- Network diagnostics
- Querying logs
- Alerting

---

# Common Networking Problems in Data Engineering

# 1. DNS Resolution Failure

## Symptoms
- Timeout errors
- Storage unreachable
- Connection failures

## Fix
- Validate Private DNS Zones
- Use nslookup
- Check VNet links

---

# 2. Storage Firewall Blocking Access

## Symptoms
```text
403 AuthorizationFailure
```

## Fix
- Add subnet/IP allow rules
- Validate Managed Identity
- Approve Private Endpoint

---

# 3. Databricks Cannot Reach Key Vault

## Causes
- NSG blocks outbound
- Missing Private Endpoint
- DNS issue

## Fix
- Add Key Vault Private Endpoint
- Update NSG rules
- Verify DNS

---

# 4. SHIR Offline

## Symptoms
ADF pipelines fail for on-prem sources.

## Fix
- Restart SHIR service
- Check VM connectivity
- Validate outbound internet access

---

# 5. Synapse Cannot Access ADLS

## Causes
- Missing Managed Private Endpoint
- Firewall restrictions
- RBAC missing

## Fix
- Approve endpoint
- Add RBAC permissions
- Validate firewall settings

---

# Security Best Practices

- Disable public access where possible
- Use Private Endpoints
- Use Managed Identity
- Restrict NSG rules
- Enable firewall protection
- Use least privilege RBAC
- Enable diagnostic logs
- Use ExpressRoute for enterprise connectivity

---

# Real-World Enterprise Architecture

```text
On-Prem SAP / SQL Server
            ↓
     ExpressRoute / VPN
            ↓
        Azure VNet
            ↓
ADF + SHIR
            ↓
ADLS Private Endpoint
            ↓
Databricks VNet Injection
            ↓
Synapse Serverless SQL
            ↓
Power BI
```

---

# Common Interview Questions

## Difference Between Service Endpoint and Private Endpoint

| Service Endpoint | Private Endpoint |
|---|---|
| Public endpoint still used | Fully private IP |
| Easier setup | More secure |
| Less isolation | Better enterprise standard |

---

## Why Use VNet Injection in Databricks?

To:
- Access Private Endpoints
- Enable enterprise networking
- Control traffic with NSGs

---

## Why Is DNS Important in Private Networking?

Without proper DNS:
- Services resolve to public IPs
- Private Endpoints fail

DNS is one of the most common root causes in Azure networking issues.

---

# Key Takeaways

- Networking secures Azure data platforms.
- Private Endpoints are critical in enterprise environments.
- DNS configuration is extremely important.
- Databricks VNet Injection enables secure enterprise networking.
- NSGs act as subnet-level firewalls.
- SHIR enables ADF connectivity to on-prem systems.
- Storage firewalls and RBAC work together for secure access.
- Most production issues are DNS, firewall, or RBAC related.