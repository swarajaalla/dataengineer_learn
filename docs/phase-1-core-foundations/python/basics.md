---
sidebar_position: 1
---

# Python Basics for Data Engineers

Python is the primary language for data engineering logic. This covers what you actually need — not data science libraries.

---

## Data Types

```python
# Primitives
order_id = "ORD-001"         # str
amount = 1250.50             # float
quantity = 10                # int
is_active = True             # bool
created_at = None            # NoneType

# Collections
tags = ["premium", "B2B"]            # list (ordered, mutable)
status_codes = (200, 201, 204)       # tuple (ordered, immutable)
regions = {"EU", "US", "APAC"}      # set (unordered, unique)
config = {"env": "prod", "db": "orders"}  # dict (key-value)
```

---

## Control Flow

```python
# Conditionals
if amount > 1000:
    tier = "premium"
elif amount > 500:
    tier = "standard"
else:
    tier = "basic"

# Loops
for region in ["EU", "US", "APAC"]:
    print(f"Processing {region}")

# List comprehension (use instead of filter/map loops)
active_orders = [o for o in orders if o["status"] == "active"]
amounts = [o["amount"] for o in orders]
```

---

## Functions

```python
def process_order(order_id: str, amount: float, discount: float = 0.0) -> dict:
    """Process a single order and return enriched record."""
    if amount <= 0:
        raise ValueError(f"Invalid amount: {amount}")
    
    final_amount = amount * (1 - discount)
    return {
        "order_id": order_id,
        "amount": amount,
        "final_amount": final_amount,
        "tier": "premium" if final_amount > 1000 else "standard",
    }

# Type hints are not enforced but document intent
result = process_order("ORD-001", 1500.0, discount=0.1)
```

---

## Dictionaries (Used Constantly)

```python
record = {
    "order_id": "ORD-001",
    "customer": {"id": "C001", "name": "Acme Corp"},
    "tags": ["premium", "B2B"],
}

# Access
order_id = record["order_id"]               # KeyError if missing
name = record.get("name", "Unknown")        # safe, returns default

# Nested access
customer_name = record["customer"]["name"]

# Iteration
for key, value in record.items():
    print(f"{key}: {value}")

# Update
record["status"] = "processed"
record.update({"processed_at": "2024-01-15", "flag": True})

# Dict comprehension
upper_keys = {k.upper(): v for k, v in record.items() if isinstance(v, str)}
```

---

## Working with Lists of Records

This is the pattern for processing API responses and JSON data:

```python
orders = [
    {"order_id": "O001", "amount": 500, "status": "active"},
    {"order_id": "O002", "amount": 0, "status": "cancelled"},
    {"order_id": "O003", "amount": 1200, "status": "active"},
]

# Filter
active = [o for o in orders if o["status"] == "active"]

# Transform
with_tier = [{**o, "tier": "premium" if o["amount"] > 1000 else "standard"} for o in orders]

# Aggregate
total = sum(o["amount"] for o in orders if o["status"] == "active")

# Sort
sorted_orders = sorted(orders, key=lambda o: o["amount"], reverse=True)
```

---

## Common Gotchas

```python
# Mutable default argument (classic bug)
def add_item(item, items=[]):   # BAD: list shared across calls
    items.append(item)
    return items

def add_item(item, items=None):  # GOOD
    if items is None:
        items = []
    items.append(item)
    return items

# Floating point precision
0.1 + 0.2 == 0.3    # False! Use Decimal for money
from decimal import Decimal
Decimal("0.1") + Decimal("0.2") == Decimal("0.3")  # True

# None checks
if value:           # falsy — misses 0, "", []
if value is None:   # correct for None checks
if value is not None:
```
