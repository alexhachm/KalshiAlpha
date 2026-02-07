# Multi-Agent Orchestration System

## Architecture

```
User → Master-1 (Interface) → handoff.json
         ↕ clarification-queue.json
       Master-2 (Architect) → task-queue.json
       Master-3 (Allocator) → TaskCreate(ASSIGNED_TO)
         ↕ worker-status.json
       Workers 1-8 (isolated worktrees, one domain each)
```

## Management Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  TIER 1: STRATEGY                                    │
│  Master-2 (Architect)                                │
│    • Owns decomposition quality                      │
│    • Decides HOW work is split                       │
│    • Can block work with clarification requests      │
│    • Reads: handoff.json, codebase-map.json          │
│    • Writes: task-queue.json, clarification-queue     │
├─────────────────────────────────────────────────────┤
│  TIER 2: OPERATIONS                                  │
│  Master-3 (Allocator)                                │
│    • Owns worker lifecycle + assignment              │
│    • Decides WHO gets work and WHEN                  │
│    • Can reset workers, reassign domains             │
│    • Can block allocation if task quality is poor    │
│    • Reads: task-queue.json, worker-status.json      │
│    • Writes: worker-status.json, fix-queue.json      │
│    • Actions: TaskCreate, TaskUpdate, PR merge        │
├─────────────────────────────────────────────────────┤
│  TIER 3: COMMUNICATION                               │
│  Master-1 (Interface)                                │
│    • Owns user relationship                          │
│    • Routes requests UP to Master-2                  │
│    • Surfaces results DOWN to user                   │
│    • Can create urgent fix tasks                     │
│    • Reads: all state (for status reports)           │
│    • Writes: handoff.json, fix-queue.json            │
├─────────────────────────────────────────────────────┤
│  TIER 4: EXECUTION                                   │
│  Workers 1-8                                         │
│    • Execute tasks assigned by Master-3              │
│    • Own their domain — no cross-domain work         │
│    • Auto-reset after 4 tasks                        │
│    • Can be force-reset by Master-3                  │
│    • Reads: TaskList (their assignments)             │
│    • Writes: worker-status.json (own entry only)     │
└─────────────────────────────────────────────────────┘
```

**Escalation paths:**
- Worker blocked → Master-3 detects via heartbeat, reassigns
- Master-3 sees bad task quality → logs warning, allocates with note to Master-2
- Master-2 needs user input → writes to clarification-queue → Master-1 surfaces to user
- Master-1 gets fix report → writes fix-queue → Master-3 routes to worker

## Your Role Context

Each master has a detailed role document — read yours at startup:
- Master-1: `.claude/docs/master-1-role.md`
- Master-2: `.claude/docs/master-2-role.md`
- Master-3: `.claude/docs/master-3-role.md`

## State Files (All Shared)

| File | Writers | Readers |
|------|---------|---------|
| `handoff.json` | Master-1 | Master-2 |
| `task-queue.json` | Master-2 | Master-3 |
| `clarification-queue.json` | Master-2 (questions), Master-1 (answers) | Both |
| `worker-status.json` | Master-3, Workers (own entry) | All |
| `fix-queue.json` | Master-1 | Master-3 |
| `codebase-map.json` | Master-2 | Master-2, Master-3 |
| `worker-lessons.md` | Master-1 (appends on fix tasks) | Workers (read at startup + before each task) |
| `change-summaries.md` | Workers (append after each task) | Workers (read before starting a task), Master-3 (read during integration) |

`.claude/state/` is a symlink to `.claude-shared-state/`. Always use the lock helper:
```bash
bash .claude/scripts/state-lock.sh .claude/state/<file> '<write command>'
```

## Logging Protocol

**All agents MUST log significant actions** to `.claude/logs/activity.log`:
```bash
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [AGENT_ID] [ACTION] details" >> .claude/logs/activity.log
```

**What to log:**
| Agent | Log these events |
|-------|-----------------|
| Master-1 | Request received, fix task created, clarification surfaced |
| Master-2 | Decomposition started/completed, clarification asked, context reset |
| Master-3 | Task allocated (with reasoning), worker reset triggered, PR merged, context reset |
| Workers | Task claimed, task completed (with PR URL), context reset, domain set |

**Log format examples:**
```
[2024-01-15T10:30:00Z] [master-1] [REQUEST] id=popout-fixes "Fix the popout bugs"
[2024-01-15T10:31:00Z] [master-2] [DECOMPOSE_START] id=popout-fixes tasks=3
[2024-01-15T10:32:00Z] [master-2] [DECOMPOSE_DONE] id=popout-fixes tasks=3 domains=popout,theme
[2024-01-15T10:32:05Z] [master-3] [ALLOCATE] task="Fix popout theme" → worker-1 reason="idle, clean context"
[2024-01-15T10:32:06Z] [master-3] [ALLOCATE] task="Fix theme vars" → worker-2 reason="idle, clean context"
[2024-01-15T10:45:00Z] [worker-1] [COMPLETE] task="Fix popout theme" pr=https://... tasks_completed=1
[2024-01-15T11:00:00Z] [master-3] [RESET_WORKER] worker-3 reason="4 tasks completed"
[2024-01-15T11:01:00Z] [worker-3] [RESET] reason="context limit" tasks_completed=4→0
```

Master-3 reads these logs to make allocation decisions. Master-1 reads them for status reports.

## Domain Rules

- Each worker owns ONE domain (set by first task)
- Workers ONLY work on their domain
- Fix tasks return to the same worker
- **39% quality drop when context has unrelated information**

## Context Lifecycle

| Agent | Reset trigger | Procedure | Loses |
|-------|--------------|-----------|-------|
| Master-1 | ~50 user messages | `/clear` → `/master-loop` | Nothing (stateless) |
| Master-2 | ~5 decompositions | `/clear` → `/scan-codebase` | Re-reads codebase |
| Master-3 | ~30 min operation | `/clear` → `/scan-codebase-allocator` | Re-reads codebase |
| Workers | 4 completed tasks | `/clear` → `/worker-loop` | Domain reset, picks up fresh |

All state lives in JSON files + activity log — no agent loses progress by resetting.

## Lessons Learned

<!-- Lessons are automatically appended here when "fix worker-N: ..." is used -->
<!-- All masters read this — mistakes become shared institutional knowledge -->
