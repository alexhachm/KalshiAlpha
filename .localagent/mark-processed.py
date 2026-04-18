#!/usr/bin/env python3
"""Append task IDs to `.localagent/processed.txt`.

Usage: mark-processed.py <task_id> [<task_id> ...]
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROCESSED = ROOT / ".localagent" / "processed.txt"
PROCESSED.parent.mkdir(exist_ok=True)
PROCESSED.touch(exist_ok=True)

existing = set(line.strip() for line in PROCESSED.read_text().splitlines() if line.strip())
new_ids = [a for a in sys.argv[1:] if a]
for tid in new_ids:
    existing.add(tid)
PROCESSED.write_text("\n".join(sorted(existing)) + "\n")
print(f"marked {len(new_ids)} task(s) processed; total={len(existing)}")
