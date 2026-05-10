---
sidebar_position: 5
---

# AWS IAM for Data Engineering

IAM (Identity and Access Management) controls who can do what on AWS. Every service interaction — Glue reading S3, EMR writing to Redshift, Lambda calling an API — is authorized via IAM.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **User** | Human identity — avoid for service-to-service auth |
| **Role** | Assumed identity for services or cross-account access |
| **Policy** | JSON document defining permissions |
| **Group** | Collection of users sharing the same policies |
| **Principal** | Who the policy applies to — user, role, service |

---

## How Services Get Access (Roles, Not Keys)

Never use IAM user access keys in code. Assign roles to services:

```
EMR Cluster → has EC2 Instance Profile (IAM Role)
    → Role has policy: S3 read/write on data lake bucket
    → Spark job on EMR reads S3 with no credentials in code

Glue Job → has IAM Role
    → Role has policy: S3 read/write + Glue Catalog access + CloudWatch logs

Lambda Function → has Execution Role
    → Role has policy: S3 read + SNS publish
```

---

## Key Policies for Data Engineering

### S3 Access Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-data-lake",
        "arn:aws:s3:::my-data-lake/*"
      ]
    }
  ]
}
```

### Glue Job Role (Managed Policy Equivalent)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": ["arn:aws:s3:::my-data-lake/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["glue:*"],
      "Resource": ["*"]
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": ["arn:aws:logs:*:*:/aws-glue/*"]
    }
  ]
}
```

---

## Assume Role — Cross-Account Access

When your data pipeline accesses a resource in a different AWS account:

```python
import boto3

# Assume a role in another account
sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::987654321:role/DataLakeReaderRole',
    RoleSessionName='glue-etl-session'
)

creds = response['Credentials']
s3 = boto3.client(
    's3',
    aws_access_key_id=creds['AccessKeyId'],
    aws_secret_access_key=creds['SecretAccessKey'],
    aws_session_token=creds['SessionToken']
)
```

---

## Secrets Manager — Storing Database Credentials

For database passwords (Redshift, RDS), use Secrets Manager — not IAM:

```python
import boto3, json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='eu-west-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

creds = get_secret('prod/redshift/etl-user')
conn_string = f"postgresql://{creds['username']}:{creds['password']}@{creds['host']}:5439/dwh"
```

Secrets Manager auto-rotates credentials on a schedule — no manual password changes.

---

## Least Privilege Principles

- Attach policies to **roles**, assign roles to services
- Never use `*` in Resource for production — scope to specific buckets/tables
- Use **Permission Boundaries** to cap what roles can do in CI/CD
- Enable **CloudTrail** to audit all API calls — who accessed what, when
- Use **SCPs (Service Control Policies)** at the Organization level to block dangerous actions (like deleting CloudTrail)

---

## IAM vs Azure RBAC

| Feature | AWS IAM | Azure RBAC |
|---------|---------|-----------|
| Identity for services | IAM Roles | Managed Identity |
| Policy format | JSON (Action/Resource/Effect) | Built-in roles + custom |
| Cross-account | Assume Role | Azure Lighthouse / B2B |
| Secret storage | Secrets Manager | Key Vault |
| Audit trail | CloudTrail | Azure Monitor / Activity Log |
