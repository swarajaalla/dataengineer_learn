---
sidebar_position: 5
---

# Azure Networking for Data Engineering

Networking in Azure controls who can reach your data services. In production, nothing should be publicly accessible.

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **VNet** | Virtual network — private IP space for Azure resources |
| **Subnet** | Segment of a VNet — you put resources in subnets |
| **Private Endpoint** | A private IP inside your VNet for a service (ADLS, Key Vault, etc.) |
| **NSG** | Network Security Group — firewall rules for a subnet |
| **VNet Injection** | Databricks clusters deployed inside your own VNet |
| **Private Link** | Technology that backs Private Endpoints |

---

## Production Setup Pattern

```
Your Corporate Network (on-prem)
    ↕ ExpressRoute / VPN Gateway
Azure VNet (10.0.0.0/16)
    ├── Subnet: databricks-public  (10.0.1.0/24)
    ├── Subnet: databricks-private (10.0.2.0/24)
    ├── Subnet: services           (10.0.3.0/24)
    │       Private Endpoints for:
    │           - ADLS (dfs endpoint)
    │           - Key Vault
    │           - Event Hub
    └── Subnet: adf-shir           (10.0.4.0/24)
            Self-Hosted Integration Runtime VM
```

---

## Private Endpoints for ADLS

When a Private Endpoint is created for ADLS:
- ADLS gets a private IP inside your VNet (e.g. `10.0.3.5`)
- DNS resolves `mystorageaccount.dfs.core.windows.net` to the private IP
- Traffic from Databricks/ADF stays inside Azure backbone — never hits the internet

```bash
# Create private endpoint for ADLS (DFS endpoint for hierarchical namespace)
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

## Databricks VNet Injection

By default Databricks clusters run in Microsoft-managed VNets. VNet injection puts clusters in YOUR VNet:

```
Benefits:
- Clusters can reach Private Endpoints (ADLS, Key Vault)
- NSG rules control what clusters can access
- Peering with on-prem networks works
- Required for most enterprise security policies
```

VNet injection needs two subnets (public + private) with specific NSG rules from Databricks.

---

## NSG Rules Pattern

```
Allow outbound: Databricks control plane IPs (from Databricks docs)
Allow outbound: Azure Storage (service tag AzureStorage)
Allow outbound: Key Vault (service tag AzureKeyVault)
Allow outbound: Azure Active Directory (service tag AzureActiveDirectory)
Deny outbound: Internet (block everything else)
```

---

## Firewall on ADLS

Restrict ADLS access to known sources only:

```json
{
  "networkAcls": {
    "defaultAction": "Deny",
    "virtualNetworkRules": [
      {"id": "/subscriptions/.../subnets/databricks-private", "action": "Allow"},
      {"id": "/subscriptions/.../subnets/services", "action": "Allow"}
    ],
    "ipRules": [
      {"iPAddressOrRange": "203.0.113.10", "action": "Allow"}
    ]
  }
}
```

---

## When You Need What

| Requirement | Solution |
|-------------|----------|
| No public internet access to ADLS | Private Endpoint + firewall |
| Databricks to reach on-prem SQL Server | VNet injection + VPN/ExpressRoute |
| ADF to reach on-prem | Self-Hosted Integration Runtime |
| Audit all network traffic | NSG flow logs → Log Analytics |
