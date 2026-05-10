---
sidebar_position: 2
---

# API Basics for Data Engineers

Data engineers pull data from REST APIs constantly — Salesforce, Dynamics, third-party data providers, internal microservices. Knowing how to work with them efficiently matters.

---

## REST API Fundamentals

**Endpoint:** A URL that returns data
```
GET https://api.salesforce.com/services/data/v58.0/sobjects/Account
```

**HTTP Methods (what DEs use):**
- `GET` — retrieve data (99% of ingestion use cases)
- `POST` — send data or trigger a query (some APIs require POST for large queries)

**Response format:** Almost always JSON.

---

## Authentication Methods

**API Key:** Simplest. Pass a key in the header.
```python
headers = {"X-API-Key": "your-key-here"}
response = requests.get(url, headers=headers)
```

**Bearer Token (OAuth 2.0):** Most modern APIs. Get a token first, use it in requests.
```python
import requests

# Step 1: Get token
token_response = requests.post(
    "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
    data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://api.example.com/.default"
    }
)
token = token_response.json()["access_token"]

# Step 2: Use token
headers = {"Authorization": f"Bearer {token}"}
response = requests.get("https://api.example.com/data", headers=headers)
```

**Basic Auth:** Username + password in header (legacy systems).
```python
response = requests.get(url, auth=("username", "password"))
```

---

## Pagination: The Critical Part

APIs limit results per page. You must loop through all pages to get all data.

**Offset-based pagination (most common):**
```python
import requests

def fetch_all_records(base_url, headers, page_size=1000):
    records = []
    offset = 0
    
    while True:
        response = requests.get(
            base_url,
            headers=headers,
            params={"limit": page_size, "offset": offset}
        ).json()
        
        page_data = response.get("data", [])
        records.extend(page_data)
        
        if len(page_data) < page_size:
            break  # last page
        offset += page_size
    
    return records
```

**Cursor-based pagination (newer APIs, handles inserts during pagination):**
```python
def fetch_with_cursor(base_url, headers):
    records = []
    next_cursor = None
    
    while True:
        params = {"cursor": next_cursor} if next_cursor else {}
        response = requests.get(base_url, headers=headers, params=params).json()
        
        records.extend(response["data"])
        next_cursor = response.get("next_cursor")
        
        if not next_cursor:
            break
    
    return records
```

**Link-based pagination (GitHub, some REST standards):**
```python
def fetch_with_links(url, headers):
    records = []
    
    while url:
        response = requests.get(url, headers=headers)
        records.extend(response.json())
        
        # Next page URL is in the Link header
        url = None
        if "Link" in response.headers:
            links = {rel: href for href, rel in 
                     [part.strip().split("; rel=") for part in response.headers["Link"].split(",")]}
            url = links.get('"next"', "").strip("<>") or None
    
    return records
```

---

## Rate Limiting: Handle It Properly

APIs enforce limits (e.g., 100 requests/minute). Hitting the limit returns HTTP 429.

```python
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retry():
    session = requests.Session()
    retry = Retry(
        total=5,
        backoff_factor=2,          # wait 2^retry seconds: 2, 4, 8, 16, 32
        status_forcelist=[429, 500, 502, 503, 504],
        respect_retry_after_header=True  # honour the Retry-After header from the API
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    return session

session = create_session_with_retry()
response = session.get(url, headers=headers)
```

---

## Writing API Data to ADLS

```python
import json
from datetime import datetime
from azure.storage.blob import BlobServiceClient

def ingest_api_to_adls(api_url, headers, storage_conn_str, container, path_prefix):
    # Fetch all pages
    records = fetch_all_records(api_url, headers)
    
    # Write as JSONL to ADLS
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    blob_path = f"{path_prefix}/{timestamp}.jsonl"
    
    content = "\n".join(json.dumps(record) for record in records)
    
    blob_client = BlobServiceClient.from_connection_string(storage_conn_str) \
        .get_blob_client(container=container, blob=blob_path)
    blob_client.upload_blob(content.encode("utf-8"), overwrite=True)
    
    print(f"Ingested {len(records)} records to {blob_path}")
```

---

## ADF: REST API Ingestion

ADF has a native REST connector:
1. **Linked Service:** REST connector → base URL + auth (API key, OAuth, Basic)
2. **Dataset:** REST dataset → relative URL, pagination rules
3. **Copy Activity:** REST source → ADLS Parquet/JSON sink

ADF handles pagination automatically for standard patterns (NextPageUrl in response, offset-based). For complex pagination, use Web Activity in a loop.

---

## Real Scenario: Salesforce Daily Ingestion

```
Schedule: Daily at 2 AM
Source: Salesforce Accounts API
Volume: 50,000 accounts per pull
Auth: OAuth 2.0 (client credentials)
Pagination: offset-based, 200 records/page
Output: JSONL in ADLS Bronze

Pattern:
1. ADF pipeline triggers at 2 AM
2. Web Activity → gets OAuth token
3. ForEach Activity → loops pages (offset 0, 200, 400...)
4. Copy Activity → writes each page as a file to ADLS Bronze
5. Databricks job triggered → reads Bronze JSONL → writes Silver Delta
```
