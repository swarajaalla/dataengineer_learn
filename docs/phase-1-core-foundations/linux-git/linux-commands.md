---
sidebar_position: 1
---

# Linux Commands for Data Engineers

Linux/shell skills are needed for deploying pipelines, managing files, and scripting on cloud servers. You don't need to be a Linux expert — know the commands you'll actually use.

---

## Navigation

```bash
pwd                      # print current directory
ls                       # list files
ls -la                   # list with details and hidden files
cd /path/to/dir          # change directory
cd ..                    # go up one level
cd ~                     # go to home directory
```

---

## File Operations

```bash
# Create
mkdir data               # create directory
mkdir -p data/raw/2024   # create with parents
touch pipeline.py        # create empty file

# Copy / Move
cp source.py dest.py          # copy file
cp -r src_dir/ dest_dir/      # copy directory
mv old_name.py new_name.py    # rename / move

# Delete
rm file.py               # delete file
rm -rf directory/        # delete directory recursively (careful!)

# View files
cat file.txt             # print entire file
head -20 file.txt        # first 20 lines
tail -50 file.log        # last 50 lines
tail -f app.log          # follow a log file (live stream)
```

---

## Searching

```bash
# Find files
find . -name "*.py"               # find Python files in current dir
find /data -name "*.parquet" -newer yesterday.txt

# Search file contents
grep "ERROR" app.log              # find lines with ERROR
grep -r "customer_id" src/        # recursive search in directory
grep -n "def transform" *.py      # show line numbers

# Count
wc -l file.txt                    # count lines
grep -c "ERROR" app.log           # count matching lines
```

---

## Process Management

```bash
# Run a script
python pipeline.py
nohup python pipeline.py &        # run in background, immune to hangup

# Monitor processes
ps aux | grep python              # find running Python processes
top                               # live process monitor
htop                              # prettier top (install separately)
kill -9 PID                       # force kill a process

# Background / foreground
python long_job.py &              # run in background
jobs                              # list background jobs
fg 1                              # bring job 1 to foreground
```

---

## File Permissions

```bash
ls -la                  # see permissions: -rwxr-xr-x
chmod +x run.sh         # make script executable
chmod 644 config.yaml   # owner read/write, others read-only
```

---

## Environment Variables

```bash
# Set (for current session)
export DATABRICKS_TOKEN="dapi123..."
export ENVIRONMENT="prod"

# Read
echo $DATABRICKS_TOKEN
printenv

# Set in a file and source it
echo 'export ENV=prod' >> ~/.bashrc
source ~/.bashrc
```

---

## Useful One-Liners for Data Work

```bash
# Count rows in CSV
wc -l data.csv

# Preview Parquet-like (using Python)
python -c "import pandas as pd; print(pd.read_parquet('data.parquet').head())"

# List large files
find . -size +100M -type f

# Disk usage
du -sh data/          # size of directory
df -h                 # disk space on all mounts

# Download a file
curl -O https://example.com/data.csv
wget https://example.com/data.csv
```
