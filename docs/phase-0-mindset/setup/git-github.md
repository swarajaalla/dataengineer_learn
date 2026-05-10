---
sidebar_position: 2
---

# Git & GitHub for Data Engineers

Every pipeline, notebook, and SQL file should be in version control. This covers the day-to-day Git workflow.

---

## Install Git

```bash
# Verify installation
git --version

# Configure your identity
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Core Workflow

```bash
# Clone a repo
git clone https://github.com/org/repo.git

# Create a feature branch
git checkout -b feature/add-orders-pipeline

# Check what changed
git status
git diff

# Stage and commit
git add src/ingestion/orders.py
git commit -m "feat: add parameterized orders ingestion pipeline"

# Push branch
git push origin feature/add-orders-pipeline

# Open a PR on GitHub, get reviewed, merge
```

---

## Branching Strategy for Data Projects

```
main         → production (protected)
develop      → staging / integration testing
feature/*    → new pipelines, features
hotfix/*     → urgent production fixes
```

**Rules:**
- Never push directly to `main`
- All changes go through a pull request
- PR requires at least one reviewer before merge

---

## What Belongs in Git

| Include | Exclude |
|---------|---------|
| Python files | `.env` (secrets) |
| SQL / dbt models | `*.pyc`, `__pycache__` |
| Notebooks (as `.py`) | Large data files |
| ADF pipeline JSONs | `node_modules` |
| Terraform / ARM templates | Auto-generated files |
| `requirements.txt` | |

---

## .gitignore Template

```gitignore
# Python
.venv/
__pycache__/
*.pyc
*.egg-info/
dist/
.pytest_cache/

# Secrets
.env
*.pem
*.key

# Data files
*.csv
*.parquet
*.json.gz

# IDE
.vscode/settings.json
.idea/

# dbt
target/
dbt_packages/
logs/
```

---

## Commit Message Convention

```
feat: add incremental load for orders table
fix: handle null order_id in silver transform
docs: update README with architecture diagram
refactor: split monolithic notebook into 3 files
test: add unit tests for orders transformation
chore: update requirements to pyspark 3.5
```

Format: `type: short description (under 72 chars)`

---

## Useful Git Commands

```bash
# View history
git log --oneline -10

# Undo last commit (keep changes)
git reset HEAD~1

# See what changed in a specific commit
git show abc1234

# Compare branch to main
git diff main...feature/my-branch

# Stash work in progress
git stash
git stash pop
```
