---
sidebar_position: 3
---

# Python Setup for Data Engineering

A clean Python environment is the foundation. Don't install packages globally — use virtual environments.

---

## Install Python 3.11+

Download from [python.org](https://www.python.org/downloads/) — use Python 3.11 or 3.12.

```bash
python --version   # Should show 3.11+
pip --version
```

---

## Virtual Environments (Always Use These)

Every project gets its own virtual environment. Never install DE packages globally.

```bash
# Create
python -m venv .venv

# Activate
.venv\Scripts\activate       # Windows PowerShell
source .venv/bin/activate    # Mac/Linux

# Deactivate
deactivate
```

---

## Standard DE Requirements File

```txt
# requirements.txt
pyspark==3.5.1
delta-spark==3.2.0
pandas==2.2.2
pyarrow==15.0.0
requests==2.31.0
python-dotenv==1.0.1
pytest==8.2.0
sqlalchemy==2.0.0
pyodbc==5.1.0
```

```bash
pip install -r requirements.txt
```

---

## Local PySpark (No Cluster Needed)

For learning Spark without a Databricks account:

```bash
# Java is required for Spark
# Download JDK 11 from adoptium.net and install

# Then install PySpark
pip install pyspark

# Test it
python -c "from pyspark.sql import SparkSession; spark = SparkSession.builder.master('local').getOrCreate(); print('Spark OK')"
```

---

## Environment Variables Pattern

Never hardcode credentials. Use `.env` files locally.

```bash
# .env (never commit this)
AZURE_STORAGE_ACCOUNT=mystorageaccount
DATABRICKS_HOST=https://adb-xxxx.azuredatabricks.net
DATABRICKS_TOKEN=dapi...
ENVIRONMENT=dev
```

```python
# In your Python code
from dotenv import load_dotenv
import os

load_dotenv()
storage_account = os.environ["AZURE_STORAGE_ACCOUNT"]
```

Commit `.env.example` with empty values as a template.

---

## Linting & Formatting

```bash
pip install ruff black

# Format code
black src/

# Lint
ruff check src/

# Add to VS Code settings.json for auto-format on save:
# "editor.formatOnSave": true
# "python.formatting.provider": "black"
```

---

## Testing

```bash
pip install pytest

# Run all tests
pytest tests/ -v

# Run specific file
pytest tests/test_transform_orders.py -v
```

Basic test structure:

```python
# tests/test_transform_orders.py
def test_removes_null_order_ids():
    import pandas as pd
    from transformation.orders import clean_orders
    df = pd.DataFrame([{"order_id": None, "amount": 100}])
    result = clean_orders(df)
    assert len(result) == 0
```
