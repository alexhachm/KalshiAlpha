---
description: "DEPRECATED — Use mac10 CLI directly. Legacy architect scan replaced by DB-backed coordinator."
---

> **DEPRECATED**: This command ended with `/architect-loop` which references file-queue operations
> (`handoff.json`, `task-queue.json`, signal files) that conflict with the DB-backed mac10
> coordinator. It also wrote launch commands to `handoff.json` directly, bypassing the coordinator.
> **Do not execute the legacy steps below.** Use mac10 CLI commands instead.

## Migration: Legacy → mac10

| Legacy operation | mac10 equivalent |
|---|---|
| Write launch commands to `handoff.json` | Not needed — coordinator tracks requests via `mac10 request` |
| `/architect-loop` at end | Use mac10 architect commands (see below) |
| Update `agent-health.json` | Still local — use `agent-health.json` directly |

## How to start the architect with mac10

Master-2 (Architect) startup sequence:

```bash
# 1. Read role document and knowledge
cat .claude/docs/master-2-role.md
cat .claude/knowledge/codebase-insights.md
cat .claude/knowledge/patterns.md

# 2. Run codebase scan (still valid — writes to local codebase-map.json)
#    The 2-pass scan (structure + signatures) is still the right approach.
#    Only the coordination steps that follow must use mac10.

# 3. After scan, start the architect loop using mac10 commands
mac10 inbox master-2 --block    # Wait for requests
mac10 triage <request_id> <tier>
mac10 create-task -              # Pipe decomposed task JSON via stdin
mac10 tier1-complete <request_id>
mac10 ask-clarification <request_id> <question>
mac10 worker-status
```

The codebase scan itself (directory tree, file sizes, git coupling, signatures) is still
a local operation that writes to `codebase-map.json` — only the triage/decomposition
loop that follows must use mac10.

## What still uses local files (NOT coordination state)

- `codebase-map.json` — scan output (domains, coupling, complexity)
- `codebase-insights.md` — architectural narrative
- `patterns.md` — decomposition and implementation patterns
- `agent-health.json` — local health tracking
- Activity log: `.claude/logs/activity.log`
