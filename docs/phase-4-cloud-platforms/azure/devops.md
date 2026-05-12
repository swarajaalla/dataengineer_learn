---
sidebar_position: 7
---

# Azure DevOps for Data Engineering

Azure DevOps is Microsoft’s platform for:
- Source control
- CI/CD automation
- Release management
- Infrastructure deployment
- Agile project management

In Data Engineering, Azure DevOps is used to:
- Deploy ADF pipelines
- Deploy Databricks notebooks/jobs
- Manage infrastructure as code
- Automate testing
- Promote code across environments

---

## Why Azure DevOps Matters in Data Engineering

Without DevOps:
- Manual deployments happen
- Production errors increase
- No rollback strategy exists
- No version control
- Environments drift over time

Azure DevOps enables:
- Automated deployments
- CI/CD pipelines
- Reproducible infrastructure
- Team collaboration
- Controlled releases

---

## Core Azure DevOps Services

| Service | Purpose |
|---|---|
| Azure Repos | Git repositories |
| Azure Pipelines | CI/CD automation |
| Azure Boards | Agile work tracking |
| Azure Artifacts | Package management |
| Azure Test Plans | Testing management |

---

## High-Level DevOps Architecture

```text
Developer
    ↓
Git Commit
    ↓
Azure Repos
    ↓
CI Pipeline
    ↓
Build Validation
    ↓
CD Pipeline
    ↓
Deploy to Dev → QA → Prod
```

---

## Azure Repos

Git-based source control system.

Stores:
- ADF JSON files
- Databricks notebooks
- Terraform code
- ARM templates
- YAML pipelines

---

## Branching Strategy

Typical enterprise branching:

```text
main/master
    ↓
develop
    ↓
feature branches
```

Example:
```text
feature/adf-incremental-load
feature/databricks-optimization
```

---

## Recommended Git Workflow

```text
Feature Branch
    ↓
Pull Request
    ↓
Code Review
    ↓
Merge to Develop
    ↓
Deploy to Dev
```

---

## Azure Pipelines

Azure Pipelines automate:
- Build
- Test
- Deploy

Supports:
- YAML pipelines
- Classic pipelines

Modern best practice:
```text
YAML Pipelines
```

---

## CI/CD in Data Engineering

| CI | CD |
|---|---|
| Validate code changes | Deploy code automatically |
| Run tests | Promote across environments |
| Build artifacts | Release to Dev/QA/Prod |

---

## Typical Data Engineering CI/CD Flow

```text
Developer Changes Notebook / Pipeline
            ↓
Commit to Git
            ↓
CI Pipeline Runs
    ├── Validate code
    ├── Run tests
    ├── Package artifacts
            ↓
CD Pipeline
    ├── Deploy ADF
    ├── Deploy Databricks
    ├── Deploy Infrastructure
            ↓
Production
```

---

## Azure DevOps with Azure Data Factory

ADF integrates natively with Git.

Supported repositories:
- Azure Repos
- GitHub

---

### ADF Git Integration

ADF stores:
- Pipelines
- Datasets
- Linked Services
- Triggers

as JSON files in Git.

---

### ADF Collaboration Branch

ADF uses:
```text
adf_publish
```

branch for deployment artifacts.

Workflow:

```text
Feature Branch
    ↓
Publish in ADF
    ↓
ADF generates ARM templates
    ↓
Stored in adf_publish
```

---

### ADF Deployment Flow

```text
Developer Changes Pipeline
            ↓
Git Commit
            ↓
Publish
            ↓
ARM Template Generated
            ↓
Azure DevOps Release Pipeline
            ↓
Deploy to Higher Environments
```

---

### ADF ARM Templates

ADF generates:
- ARMTemplateForFactory.json
- ARMTemplateParametersForFactory.json

These are deployed through Azure DevOps.

---

### ADF Environment Parameterization

Different environments require different values.

Examples:
- Storage account names
- Key Vault URLs
- SQL connection strings

Use:
```text
ARM template parameters
```

for environment-specific configuration.

---

## Databricks + Azure DevOps

Azure DevOps is commonly used for:
- Notebook deployment
- Job deployment
- Cluster policies
- Databricks Asset Bundles
- Terraform automation

---

### Databricks Deployment Approaches

| Approach | Usage |
|---|---|
| Databricks CLI | Basic deployments |
| REST API | Job automation |
| Terraform | Infrastructure deployment |
| Databricks Asset Bundles | Modern CI/CD approach |

---

### Databricks Notebook Deployment Flow

```text
Developer Notebook
        ↓
Git Repo
        ↓
Azure Pipeline
        ↓
Databricks CLI/API
        ↓
Deploy to Workspace
```

---

### Databricks CLI Example

```bash
databricks workspace import_dir \
    ./notebooks \
    /Shared/project-notebooks \
    --overwrite
```

---

### Databricks Job Deployment

Deploy jobs automatically:

```json
{
  "name": "daily_orders_job",
  "tasks": [
    {
      "task_key": "orders_notebook",
      "notebook_task": {
        "notebook_path": "/Shared/orders"
      }
    }
  ]
}
```

Deploy using:
```bash
databricks jobs create --json-file job.json
```

---

### Databricks Asset Bundles (Modern Approach)

Recommended modern deployment model.

Supports:
- Jobs
- Pipelines
- Notebooks
- Workflows

as code.

Benefits:
- Version control
- Reproducible deployments
- Easier CI/CD

---

## Terraform in Data Engineering

Terraform is commonly used with Azure DevOps to deploy:
- VNets
- ADLS
- Databricks
- Synapse
- Key Vault
- Private Endpoints

---

### Infrastructure as Code (IaC)

Instead of manually creating resources:

```text
Portal Clicks ❌
Terraform Code ✅
```

---

### Terraform Deployment Flow

```text
Terraform Code
        ↓
Git Commit
        ↓
Azure DevOps Pipeline
        ↓
terraform init
terraform plan
terraform apply
        ↓
Infrastructure Created
```

---

### Example Terraform Resources

```hcl
resource "azurerm_storage_account" "adls" {
  name                     = "myadlsstorage"
  resource_group_name      = "rg-data"
  location                 = "Central India"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

---

### Multi-Environment Deployment Strategy

Typical environments:

```text
DEV → QA → UAT → PROD
```

Each environment has:
- Separate resources
- Separate Key Vaults
- Separate storage accounts

---

### Deployment Approval Gates

Production deployments should require approval.

Example:

```text
QA Deployment
        ↓
Manual Approval
        ↓
Production Deployment
```

---

### Variable Groups

Azure DevOps Variable Groups store:
- Environment configs
- Secrets
- URLs
- Parameters

Integrated with:
```text
Azure Key Vault
```

---

### Service Connections

Azure DevOps uses Service Connections to authenticate with Azure.

Common types:
- Azure Resource Manager
- Databricks
- GitHub

Best practice:
```text
Use Managed Identity or Federated Credentials
```

Avoid long-lived secrets.

---

### YAML Pipeline Example

```yaml
trigger:
- main

pool:
  vmImage: ubuntu-latest

steps:
- script: echo "Deploying ADF"

- task: AzureResourceManagerTemplateDeployment@3
  inputs:
    deploymentScope: 'Resource Group'
    azureResourceManagerConnection: 'azure-service-connection'
```

---

## CI/CD for Synapse

Synapse deployment includes:
- SQL scripts
- Pipelines
- Spark notebooks
- Linked services

Uses:
- ARM templates
- Git integration
- Azure DevOps release pipelines

---

# Common Data Engineering Deployment Flow

```text
Git Repo
    ├── ADF JSON
    ├── Databricks Notebooks
    ├── Terraform
    ├── SQL Scripts
    └── YAML Pipelines
            ↓
Azure DevOps
            ↓
Deploy to Azure Services
```

---

# Secrets Management in DevOps

Never store:
- Passwords
- Keys
- Tokens

inside:
- YAML files
- Notebooks
- Git repos

Use:
```text
Azure Key Vault
```

instead.

---

## Common DevOps Problems in Data Engineering

### 1. Environment Drift 
DEV and PROD configurations differ.
Use:
- Terraform
- ARM templates
- Parameterized deployments

---

### 2. Hardcoded Configurations
Storage account names hardcoded.
please use:
- Variables
- Parameter files
- Key Vault integration

---

### 3. Manual Deployments
Engineers deploy from portal manually.
Risks include 
- Human errors
- No audit trail
- Inconsistent deployments

Use CI/CD pipelines.

---

### 4. Databricks Notebook Conflicts

Multiple developers overwrite notebooks.

Fixes : 
- Git integration
- Branch strategy
- Pull requests

---

### 5. Pipeline Deployment Failures
General causes 
- Missing RBAC
- Wrong parameters
- Missing dependencies

Fixes: 
- Validate deployment order
- Use pre-deployment checks
- Use proper service connections

---

# Monitoring CI/CD Pipelines

Monitor:
- Build failures
- Deployment failures
- Test results
- Release history

Use:
- Azure Monitor
- Log Analytics
- Azure DevOps dashboards

---

# Security Best Practices

- Use RBAC with least privilege
- Use Managed Identity where possible
- Integrate Key Vault
- Avoid storing secrets in Git
- Enable branch policies
- Require pull request approvals
- Use deployment approvals for PROD
- Audit pipeline activity

---

# Real-World Enterprise Architecture

```text
Developer
    ↓
Azure Repos
    ↓
Azure DevOps Pipelines
    ├── Deploy Terraform
    ├── Deploy ADF
    ├── Deploy Databricks
    ├── Deploy Synapse
    ↓
Azure Environment
    ├── ADLS
    ├── Databricks
    ├── Synapse
    └── Key Vault
```

---

# Common Interview Questions

## Why Use Azure DevOps in Data Engineering?

To:
- Automate deployments
- Maintain version control
- Reduce manual effort
- Standardize environments

---

## How Does ADF CI/CD Work?

ADF:
- Stores JSON in Git
- Generates ARM templates
- Azure DevOps deploys templates

---

## How Do You Deploy Databricks Using DevOps?

Common methods:
- Databricks CLI
- REST API
- Terraform
- Asset Bundles

---

## Why Is Infrastructure as Code Important?

Because it provides:
- Repeatability
- Automation
- Auditability
- Disaster recovery capability

---

# Key Takeaways

- Azure DevOps enables CI/CD for Azure data platforms.
- ADF integrates natively with Git and ARM templates.
- Databricks deployments can be automated using CLI, APIs, or Terraform.
- Terraform enables Infrastructure as Code.
- CI/CD reduces manual deployment risks.
- Key Vault should always be used for secrets management.
- Enterprise deployments require approvals, RBAC, and monitoring.