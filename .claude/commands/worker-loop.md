---
description: Worker loop with explicit polling and auto-continue after task completion.
---

You are a **Worker**. Check your branch to know your ID:
```bash
git branch --show-current
```
- agent-1 → worker-1
- agent-2 → worker-2
- etc.

## Startup

1. Determine your worker ID from branch name
2. Register yourself using the locking helper:
```bash
# Read current status
cat .claude/state/worker-status.json

# Add/update your entry using lock:
# bash .claude/scripts/state-lock.sh .claude/state/worker-status.json '<update command>'
# "worker-N": {"status": "idle", "domain": null, "current_task": null, "tasks_completed": 0, "queued_task": null, "awaiting_approval": false, "last_heartbeat": "<ISO timestamp>"}
```

3. Announce:
```
████  I AM WORKER-N  ████

Domain: none (will be assigned on first task)
Status: idle, polling for tasks...
```

4. Read worker lessons (mistakes from previous tasks across all workers):
```bash
cat .claude/state/worker-lessons.md
```
Internalize these lessons — they are hard-won knowledge from this project. Apply them to every task you work on.

5. Begin the loop

## The Loop (Explicit Steps)

**Repeat these steps forever:**

### Step 0: Heartbeat
Update your `last_heartbeat` timestamp in worker-status.json every cycle:
```bash
# bash .claude/scripts/state-lock.sh .claude/state/worker-status.json '<update your last_heartbeat to current ISO timestamp>'
```
This lets Master-3 detect dead workers. If you skip this, Master-3 will mark you as dead after 90s.

### Step 1: Check for urgent fix tasks
```bash
cat .claude/state/worker-status.json
```

Look at your entry. If there is a fix task pending for you (check fix-queue.json), handle it FIRST before any other work.

### Step 2: Check for assigned tasks
```bash
TaskList()
```

Look for tasks where:
- Description contains `ASSIGNED_TO: worker-N` (your ID)
- Status is "pending" or "open"

**RESET tasks take absolute priority.** If you see a task with subject starting with "RESET:" assigned to you:
1. Mark the task complete: `TaskUpdate(task_id, status="completed")`
2. Update worker-status.json: `status: "resetting", tasks_completed: 0, domain: null`
3. Run `/clear`
4. Run `/worker-loop`
Do NOT finish any current work first — RESET means your context is too degraded to produce quality output.

Also check for URGENT fix tasks (these have priority over normal tasks).

### Step 3: If task found - validate domain

**If this is your FIRST task:**
- Extract DOMAIN from task description
- This becomes YOUR domain
- Update worker-status.json with your domain

**If you already have a domain:**
- Check if task's DOMAIN matches your domain
- If YES: proceed to claim
- If NO: this is an error - Master-3 shouldn't assign cross-domain. Say: "ERROR: Assigned task [X] but my domain is [Y]. Skipping."
- ```bash
  sleep 10
  ```
- Go to Step 1

### Step 4: Claim and work

1. **Claim the task:**
```
TaskUpdate(task_id, status="in_progress", owner="worker-N")
```

2. **Update your status using lock:**
```bash
# bash .claude/scripts/state-lock.sh .claude/state/worker-status.json '<update command>'
# Set: status="busy", current_task="[task subject]"
```

3. **Read recent changes by other workers:**
```bash
cat .claude/state/change-summaries.md
```
Check for changes that overlap with or affect the files you're about to modify. If another worker has recently changed a file you depend on, account for their changes in your approach.

4. **Announce:**
```
CLAIMED: [task subject]
Domain: [domain]
Files: [files from description]

Starting work...
```

5. **Plan** (Enter Plan Mode - Shift+Tab twice):
- Understand the task fully
- List the changes needed
- Identify risks

6. **Review** (if 5+ files):
- Spawn code-architect subagent
- Wait for APPROVE/NEEDS CHANGES/REJECT
- If NEEDS CHANGES: revise plan
- If REJECT: mark task as blocked, go to Step 1

7. **Build:**
- Implement the changes
- Follow existing patterns in the codebase
- Make minimal, focused changes

8. **Verify:**
- Spawn build-validator: check build/lint/types/tests
- Spawn verify-app: check feature works
- If issues found: fix them, re-verify

9. **Ship:**
- Run `/commit-push-pr`
- Note the PR URL

### Step 6: Log completion and continue

1. **Update status using lock:**
```bash
# bash .claude/scripts/state-lock.sh .claude/state/worker-status.json '<update command>'
# Set: status="completed_task", current_task="[task subject]", last_pr="[PR URL]"
# IMPORTANT: Increment tasks_completed by 1 (read current value first)
# Clear queued_task to null if this was the queued task
```

2. **Mark task complete:**
```
TaskUpdate(task_id, status="completed")
```

3. **Log completion for async review:**
```
════════════════════════════════════════
TASK COMPLETE: [task subject]
PR: [PR URL]

Files changed:
• [file1]
• [file2]

Continuing to next task...
(User can review via "status" in Master-1)
(User can send "fix worker-N: [issue]" if something's wrong)
════════════════════════════════════════
```

**Log to activity log:**
```bash
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [worker-N] [COMPLETE] task=\"[task subject]\" pr=[PR URL] tasks_completed=[count]" >> .claude/logs/activity.log
```

4. **Write change summary (so other workers know what you changed):**
```bash
bash .claude/scripts/state-lock.sh .claude/state/change-summaries.md 'cat >> .claude/state/change-summaries.md << SUMMARY

## [ISO timestamp] worker-N | domain: [domain] | task: "[task subject]"
**Files changed:** [list of files you modified]
**What changed:** [2-3 sentence summary of what you did and why — focus on interface changes, shared state changes, or anything another worker touching nearby code would need to know]
**PR:** [PR URL]
---
SUMMARY'
```

5. **Check task count — self-reset at 4:**
```bash
cat .claude/state/worker-status.json
```
Read your `tasks_completed` value. If it is now 4 or higher:
- Say: "Reached 4 completed tasks — resetting context for quality."
- Log: `echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [worker-N] [RESET] reason=\"context limit\" tasks_completed=4→0" >> .claude/logs/activity.log`
- Update worker-status.json: `status: "resetting", tasks_completed: 0, domain: null`
- Run `/clear`
- Run `/worker-loop`

If under 4, **immediately go back to Step 0** (heartbeat) to pick up the next task. Do NOT wait for approval.

### Step 7: If no task found
- Say: "No tasks assigned. Polling... (checking in 10s)"
- ```bash
  sleep 10
  ```
- If you just completed a task in the previous cycle, use `sleep 3` instead (next task may be queued)
- Go back to Step 0 (heartbeat)

## Domain Rules Summary

- You get ONE domain, set by your first task
- You ONLY work on tasks in your domain
- Fix tasks for your work come back to YOU (same domain)

## Context Reset

Your context window degrades after sustained work. The system handles this automatically:

**At 4 completed tasks:** Master-3 will send you a task with subject starting with "RESET:". When you receive a RESET task:
1. Update worker-status.json: `status: "resetting", tasks_completed: 0, domain: null`
2. Run `/clear`
3. Run `/worker-loop` — you will restart with a clean context and get assigned a new domain on your next task

**Domain reassignment:** Master-3 may also send a RESET task when your current domain doesn't match available work. Same process — clear and restart.

**Self-check:** If you notice yourself forgetting file contents you read earlier in the session, struggling with tasks that should be straightforward, or re-reading files you already read — proactively reset:
1. Finish your current task first (if any)
2. Update worker-status.json: `status: "resetting", tasks_completed: 0, domain: null`
3. Run `/clear`
4. Run `/worker-loop`

## Emergency Commands

If something goes wrong:
- `/clear` then `/worker-loop` - Full context reset and restart
- Manually update worker-status.json to reset your state
