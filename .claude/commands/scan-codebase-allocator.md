---
description: "DEPRECATED — Use mac10 CLI directly. Legacy allocator scan replaced by DB-backed coordinator."
---

> **DEPRECATED**: This command ended with `/allocate-loop` which references file-queue operations
> (`task-queue.json`, `fix-queue.json`, `worker-status.json`, signal files) that conflict with
> the DB-backed mac10 coordinator.
> **Do not execute the legacy steps below.** Use mac10 CLI commands instead.

## Migration: Legacy → mac10

| Legacy operation | mac10 equivalent |
|---|---|
| Poll `codebase-map.json` for Master-2 scan | Read `codebase-map.json` directly (still local, not coordination state) |
| Update `agent-health.json` | Still local — use `agent-health.json` directly |
| Run independent fallback scan | Still valid — scan writes to local `codebase-map.json` |
| `/allocate-loop` at end | Use mac10 allocator commands (see below) |

## How to start the allocator with mac10

Master-3 (Allocator) startup sequence:

```bash
# 1. Read role document and knowledge
cat .claude/docs/master-3-role.md
cat .claude/knowledge/allocation-learnings.md
cat .claude/knowledge/codebase-insights.md

# 2. Load codebase map (still a local file — NOT coordination state)
cat .claude/state/codebase-map.json

# 3. Check worker status via mac10
mac10 worker-status

# 4. Get tasks ready for assignment
mac10 ready-tasks

# 5. Start allocating using mac10 commands
mac10 assign-task <task_id> <worker_id>
mac10 check-completion <request_id>
mac10 integrate <request_id>
```

The codebase scan itself (reading directory structure, git coupling, file sizes) is still
a local operation — only the task allocation/routing that follows must use mac10.

## What still uses local files (NOT coordination state)

- `codebase-map.json` — scan output, read by allocator and workers
- `codebase-insights.md` — architectural narrative
- `allocation-learnings.md` — allocator session knowledge
- `agent-health.json` — local health tracking
- Activity log: `.claude/logs/activity.log`
