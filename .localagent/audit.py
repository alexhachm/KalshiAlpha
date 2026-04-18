#!/usr/bin/env python3
"""Scan localagent.md for task blocks; emit unprocessed ones as JSON.

Task format in localagent.md:

    ## Task: <title>
    <body lines — until next `## ` heading or EOF>

Task ID is sha1(title + body)[:12]; processed IDs tracked in
`.localagent/processed.txt`. Designed to be called repeatedly; idempotent.
"""
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILE = ROOT / "localagent.md"
STATE_DIR = ROOT / ".localagent"
STATE_DIR.mkdir(exist_ok=True)
PROCESSED = STATE_DIR / "processed.txt"
PROCESSED.touch(exist_ok=True)

processed = set(line.strip() for line in PROCESSED.read_text().splitlines() if line.strip())
raw = FILE.read_text(encoding="utf-8") if FILE.exists() else ""

# Strip fenced code blocks so format examples don't get parsed as tasks.
content = re.sub(r"^```.*?^```\s*$", "", raw, flags=re.MULTILINE | re.DOTALL)

pattern = re.compile(r"^## Task:\s*(.+?)\n(.*?)(?=^## |\Z)", re.MULTILINE | re.DOTALL)
tasks = []
for m in pattern.finditer(content):
    title = m.group(1).strip()
    body = m.group(2).strip()
    if not title:
        continue
    tid = hashlib.sha1((title + "\n" + body).encode("utf-8")).hexdigest()[:12]
    if tid not in processed:
        tasks.append({"id": tid, "title": title, "body": body})

json.dump(tasks, sys.stdout, indent=2)
sys.stdout.write("\n")
