---
description: "DEPRECATED — Use mac10 CLI directly. Legacy architect loop replaced by DB-backed coordinator."
---

> **DEPRECATED**: This command used file-based queues (`handoff.json`, `task-queue.json`)
> and signal files (`.handoff-signal`, `.task-signal`) that conflict with the DB-backed
> mac10 coordinator. **Do not execute the legacy steps below.** Use mac10 CLI commands instead.

## Migration: Legacy → mac10

| Legacy operation | mac10 equivalent |
|---|---|
| `cat .claude/state/handoff.json` | `mac10 inbox master-2 --peek` |
| Wait for `.handoff-signal` | `mac10 inbox master-2 --block` |
| Dequeue from `handoff.json` | `mac10 inbox master-2` (auto-dequeues) |
| Write to `task-queue.json` (Tier 3) | `mac10 create-task -` (pipe JSON via stdin) |
| Update `handoff.json` status | `mac10 triage <request_id> <tier>` |
| `touch .claude/signals/.task-signal` | Not needed — coordinator notifies automatically |
| `touch .claude/signals/.handoff-signal` | Not needed — coordinator notifies automatically |
| Tier 1 complete + update `handoff.json` | `mac10 tier1-complete <request_id> [result]` |
| Claim worker in `worker-status.json` | `mac10 assign-task <task_id> <worker_id>` |
| Write `worker-N.json` task file | `mac10 assign-task <task_id> <worker_id>` |
| Ask user for clarification | `mac10 ask-clarification <request_id> <question>` |
| Write to `clarification-queue.json` | `mac10 ask-clarification <request_id> <question>` |

## How to run the architect loop with mac10

Master-2 (Architect) should use these mac10 commands in its loop:

```bash
# Wait for new requests (blocking — returns when a request arrives)
mac10 inbox master-2 --block

# Peek at inbox without blocking
mac10 inbox master-2 --peek

# Classify a request by tier
mac10 triage <request_id> <tier> [reasoning]

# Create decomposed tasks (Tier 3) — pipe JSON from stdin
echo '{"request_id":"...","subject":"...","description":"...","domain":"...","files":["..."]}' | mac10 create-task -

# Mark Tier 1 as complete
mac10 tier1-complete <request_id> [result]

# Ask user for clarification
mac10 ask-clarification <request_id> <question>

# Assign a Tier 2 task directly to a worker
mac10 assign-task <task_id> <worker_id>

# Check worker availability
mac10 worker-status
```

## What still uses local files (NOT coordination state)

These operations are NOT managed by mac10 and still use local files:
- Knowledge files: `codebase-insights.md`, `patterns.md`, `mistakes.md`
- Codebase map: `codebase-map.json` (scan output, read by workers)
- Change summaries: `change-summaries.md`
- Activity log: `.claude/logs/activity.log`
- Agent health: `agent-health.json` (local tracking only)
