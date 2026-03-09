---
description: "DEPRECATED — Use mac10 CLI directly. Legacy allocator loop replaced by DB-backed coordinator."
---

> **DEPRECATED**: This command used file-based queues (`task-queue.json`, `fix-queue.json`,
> `worker-status.json`) and signal files (`.task-signal`, `.fix-signal`, `.completion-signal`)
> that conflict with the DB-backed mac10 coordinator.
> **Do not execute the legacy steps below.** Use mac10 CLI commands instead.

## Migration: Legacy → mac10

| Legacy operation | mac10 equivalent |
|---|---|
| `cat .claude/state/task-queue.json` | `mac10 ready-tasks` |
| `cat .claude/state/fix-queue.json` | `mac10 ready-tasks` (fix tasks are in the DB) |
| `cat .claude/state/worker-status.json` | `mac10 worker-status` |
| Write task to `task-queue.json` | `mac10 create-task -` (pipe JSON via stdin) |
| Write `worker-N.json` task file | `mac10 assign-task <task_id> <worker_id>` |
| `touch .claude/signals/.task-signal` | Not needed — coordinator notifies automatically |
| `touch .claude/signals/.fix-signal` | Not needed — coordinator notifies automatically |
| `touch .claude/signals/.completion-signal` | Not needed — coordinator notifies automatically |
| `bash .claude/scripts/launch-worker.sh N` | `mac10 add-worker` |
| Check request completion | `mac10 check-completion <request_id>` |
| Merge/integrate PRs | `mac10 integrate <request_id>` |
| Check file overlaps | `mac10 check-overlaps <request_id>` |

## How to run the allocator loop with mac10

Master-3 (Allocator) should use these mac10 commands in its loop:

```bash
# Get tasks ready for assignment
mac10 ready-tasks

# Assign a task to a worker (atomic — no race conditions)
mac10 assign-task <task_id> <worker_id>

# Check worker status
mac10 worker-status

# Check if all tasks for a request are done
mac10 check-completion <request_id>

# Trigger worktree merge/integration
mac10 integrate <request_id>

# Create a new worker worktree
mac10 add-worker

# Send heartbeat
mac10 heartbeat <worker_id>

# Reset a stuck worker
mac10 reset-worker <worker_id>
```

## What still uses local files (NOT coordination state)

These operations are NOT managed by mac10 and still use local files:
- Knowledge files: `mistakes.md`, `patterns.md`, `allocation-learnings.md`
- Domain knowledge: `.claude/knowledge/domain/*.md`
- Change summaries: `change-summaries.md`
- Activity log: `.claude/logs/activity.log`
- Agent health: `agent-health.json` (local tracking only)
