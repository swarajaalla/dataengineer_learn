---
sidebar_position: 1
---

# VS Code Setup for Data Engineering

VS Code is the primary IDE for data engineering. This covers the setup and extensions you'll actually use.

---

## Install VS Code

Download from [code.visualstudio.com](https://code.visualstudio.com/)

---

## Essential Extensions

Install these from the Extensions panel (`Ctrl+Shift+X`):

### Core
| Extension | Publisher | Why |
|-----------|-----------|-----|
| **Python** | Microsoft | Python language support, linting, debugging |
| **Pylance** | Microsoft | Fast type checking and autocomplete |
| **Ruff** | Astral Software | Fast Python linter + formatter |

### Data Engineering
| Extension | Publisher | Why |
|-----------|-----------|-----|
| **SQL Tools** | Matheus Teixeira | Database connections, query runner |
| **dbt Power User** | Altimate AI | dbt model navigation, autocomplete, lineage |
| **Azure Tools** | Microsoft | Bundle of all Azure extensions |
| **Databricks** | Databricks | Connect to Databricks, sync notebooks |

### Git & DevOps
| Extension | Publisher | Why |
|-----------|-----------|-----|
| **GitLens** | GitKraken | Enhanced git history and blame |
| **GitHub Actions** | GitHub | Syntax highlight and validate workflows |

### Utilities
| Extension | Publisher | Why |
|-----------|-----------|-----|
| **Even Better TOML** | tamasfe | For pyproject.toml, Cargo.toml |
| **YAML** | Red Hat | YAML validation for Airflow, GitHub Actions |
| **Prettier** | Prettier | Format JSON, YAML, Markdown |

---

## Key Settings to Configure

Open settings (`Ctrl+,`) and set:

```json
{
  "editor.formatOnSave": true,
  "python.defaultInterpreterPath": ".venv/bin/python",
  "editor.rulers": [88],
  "files.trimTrailingWhitespace": true,
  "editor.tabSize": 4
}
```

---

## Workspace Setup for a DE Project

```bash
# Create project folder
mkdir my-pipeline && cd my-pipeline

# Create virtual env
python -m venv .venv
.venv\Scripts\activate       # Windows
source .venv/bin/activate    # Mac/Linux

# Open in VS Code
code .
```

VS Code will detect the `.venv` automatically. Select it as the Python interpreter (`Ctrl+Shift+P` → "Python: Select Interpreter").

---

## Useful Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick file open |
| `Ctrl+`` ` | Open terminal |
| `Ctrl+Shift+F` | Search across all files |
| `Alt+Shift+F` | Format document |
| `F12` | Go to definition |
| `Ctrl+B` | Toggle sidebar |
