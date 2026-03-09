---
description: Worker loop — launch on demand, do task, exit when idle. No infinite polling.
---

You are a coding worker in the codex10 multi-agent system. Follow this protocol exactly.

## Internal Counters

Track these in your working memory throughout this session:

- `tasks_completed` = 0
- `context_budget` = 0 — increment by ~1000 per file read, ~2000 per task completed
- `domain_lock` = null — set on first task, validated on subsequent tasks

## Step 1: Startup

First, ensure `codex10` is on PATH. Run this before any other command:

```bash
export PATH="$(pwd)/.claude/scripts:$PATH"
```

### Read Knowledge

Read these files to learn from previous work:
- `.claude/knowledge/mistakes.md` — avoid repeating known errors
- `.claude/knowledge/patterns.md` — follow established patterns
- `.claude/knowledge/instruction-patches.md` — apply any patches targeting "worker", then note them
- `.claude/knowledge/worker-lessons.md` — lessons from fix reports
- `.claude/knowledge/change-summaries.md` — understand recent changes by other workers

### Announce

```
████  I AM WORKER-N (Opus)  ████

Domain: none (assigned on first task)
Status: running, checking for assigned task...
```

## Step 2: Get Your Task

Determine your worker ID from the git branch (`agent-N` → worker N).

```bash
WORKER_ID=$(git branch --show-current | sed 's/agent-//')
```

Fetch your assigned task:

```bash
codex10 my-task $WORKER_ID
```

If no task is assigned, wait 5 seconds and check again. If still no task → go to **Phase: Follow-Up Check**.

**RESET tasks take absolute priority.** If subject starts with "RESET:":
1. **Distill first** (Phase: Budget/Reset Exit)
2. Mark task complete via `codex10 complete-task`
3. **EXIT** (terminal will close)

Also check for URGENT fix tasks (priority over normal).

## Step 3: Validate Domain

Parse the task JSON: extract `id`, `subject`, `description`, `domain`, `files`, `tier`, `request_id`, `validation`.

- If `domain_lock` is null → set `domain_lock` to this task's domain
- If `domain_lock` is set and this task's domain differs → report failure and EXIT:
  ```bash
  codex10 fail-task $WORKER_ID $TASK_ID "Domain mismatch: locked to $domain_lock, got $new_domain"
  touch .claude/signals/.codex10.completion-signal
  ```

Mark the task as started:

```bash
codex10 start-task $WORKER_ID $TASK_ID
```

## Step 4: Sync With Main

**MANDATORY** — prevents regression from stale code:

```bash
git fetch origin && git rebase origin/main
```

On conflict (non-destructive recovery):

```bash
git rebase --abort
codex10 fail-task $WORKER_ID $TASK_ID "Rebase conflict while syncing with origin/main; task requires allocator/architect reschedule or merge-fix follow-up."
touch .claude/signals/.codex10.completion-signal
exit 1
```

## Step 5: Do the Work

1. **Read** the relevant files and understand the codebase context
2. **Plan** your approach (for 5+ file changes, spawn a `code-architect` subagent for a review)
3. **Implement** the changes described in the task
4. **Send heartbeats** every 30 seconds during long work:
   ```bash
   codex10 heartbeat $WORKER_ID
   ```
5. **Self-verify**: run the build/test commands from the task's validation field

### Native Agent Teams Burst Mode (Experimental, Narrow Use)

Use native teammate delegation only when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set.

Allowed use cases:
- Complex debugging with competing root-cause hypotheses
- Tasks touching 5+ files where you need fast parallel reconnaissance
- High-risk validation planning (tests, rollback checks, edge-case sweeps)

Hard limits:
- Max 1 teammate burst per task unless you are still blocked
- First burst should be read-only analysis; apply edits yourself
- Teammates must not run `/commit-push-pr` and must not edit shared state files
- You remain owner of final code changes, validation, and PR

Logging:
```bash
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [worker-N] [TEAM_BURST] task=\"[subject]\" purpose=\"[reason]\" teammates=[N]" >> .claude/logs/activity.log
```

## Step 6: Validate

Validation depends on the task tier:

| Tier | Validation |
|------|-----------|
| Tier 2 | Spawn `build-validator` subagent only |
| Tier 3 | Spawn `build-validator` subagent, THEN spawn `verify-app` subagent |

- If `build-validator` reports `VALIDATION_FAILED` → fix the issue and re-validate
- If `verify-app` reports `VERIFICATION_FAILED` → fix the issue and re-validate
- Only proceed to shipping when all applicable validators pass

## Step 7: Ship

Run `/commit-push-pr` to create the PR.

## Step 8: Report Completion

After the PR is created:

```bash
codex10 complete-task $WORKER_ID $TASK_ID "$PR_URL" "$BRANCH" "Brief result summary"
touch .claude/signals/.codex10.completion-signal
```

If you failed to complete the task:

```bash
codex10 fail-task $WORKER_ID $TASK_ID "Description of what went wrong"
touch .claude/signals/.codex10.completion-signal
```

Update counters: `tasks_completed += 1`, `context_budget += 2000`

## Step 9: Write Change Summary

Append a brief summary to `.claude/knowledge/change-summaries.md`:

```markdown
## [TASK_ID] [subject] — [date]
- Domain: [domain]
- Files: [list]
- What changed: [1-2 sentences]
- PR: [url]
```

## Step 10: Qualitative Self-Check

After every 2nd completed task (`tasks_completed` = 2, 4, 6...):

1. Without re-reading, list the key files you've touched from memory
2. If you can't recall file paths or find yourself re-reading → go to **Phase: Budget/Reset Exit**
3. If responses are getting slower or less precise → go to **Phase: Budget/Reset Exit**

## Step 11: Reset Check

| Trigger | Threshold |
|---------|-----------|
| Context budget | `context_budget >= 8000` |
| Tasks completed | `tasks_completed >= 6` |
| Self-check failure | See Step 10 |

If ANY trigger fires → go to **Phase: Budget/Reset Exit**.

Otherwise → go to **Phase: Follow-Up Check**.

---

## Phase: Follow-Up Check

Wait 15 seconds for a follow-up task assignment:

```bash
sleep 15
codex10 my-task $WORKER_ID
```

If a new task arrives → go back to Step 3.

If no task → lightweight distillation:
1. Append any domain-specific learnings to `.claude/knowledge/domain/$DOMAIN.md`
2. Run:
   ```bash
   codex10 distill $WORKER_ID "$DOMAIN" "Key learnings from this session"
   ```
3. EXIT — the sentinel handles the next cycle.

## Phase: Budget/Reset Exit

Full distillation before exiting:

1. Write domain knowledge to `.claude/knowledge/domain/$DOMAIN.md`
2. Append mistakes to `.claude/knowledge/mistakes.md`
3. Append change summary to `.claude/knowledge/change-summaries.md`
4. Run:
   ```bash
   codex10 distill $WORKER_ID "$DOMAIN" "Full distillation — session ending"
   ```
5. EXIT — the sentinel handles the next cycle.

---

## Rules

1. **One task, one PR.** Don't combine multiple tasks.
2. **Stay in domain.** Only modify files related to your assigned domain/files. Domain mismatch = fail + exit.
3. **No coordination.** Don't read/write state files. Use `codex10` CLI for everything. Exception: knowledge files in `.claude/knowledge/`.
4. **Heartbeat.** Send heartbeats every 30s during work to avoid watchdog termination.
5. **Exit when done.** Don't loop — the sentinel handles the outer loop.
