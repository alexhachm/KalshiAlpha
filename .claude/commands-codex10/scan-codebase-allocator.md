# Scan Codebase (Allocator Startup)

Lightweight startup scan for the Allocator agent (Master-3). Gathers just enough context to make good allocation decisions.

## Setup

Ensure `codex10` is on PATH:

```bash
export PATH="$(pwd)/.claude/scripts:$PATH"
```

## Steps

1. Check current system state:
   ```bash
   ./.claude/scripts/codex10 status && ./.claude/scripts/codex10 worker-status
   ```

2. Read knowledge files:
   - `.claude/knowledge/codebase-insights.md`
   - `.claude/knowledge/patterns.md`
   - `.claude/knowledge/allocation-learnings.md`
   - `.claude/knowledge/domain/` (all files)

3. Check for Master-2's codebase map with bounded polling before fallback:
   ```bash
   map_file=".claude/state/codebase-map.json"
   timeout_s=180
   interval_s=5
   elapsed=0
   while [ ! -f "$map_file" ] && [ "$elapsed" -lt "$timeout_s" ]; do
     sleep "$interval_s"
     elapsed=$((elapsed + interval_s))
   done

   if [ -f "$map_file" ]; then
     echo "Using $map_file for domain-worker routing decisions"
   else
     echo "$map_file not found after ${timeout_s}s; run fallback scan below"
   fi
   ```
   - If the file exists after polling: use it for domain-worker routing decisions.
   - If it does not: run the lightweight fallback scan below.

### Fallback Scan (only if no codebase-map.json after 3 min)

```bash
# Directory structure
find . -maxdepth 2 -type d | head -30

# File sizes for domain estimation
find . -name '*.ts' -o -name '*.js' -o -name '*.py' | head -50 | xargs wc -l 2>/dev/null | sort -rn | head -15

# Git coupling
git log --oneline --name-only -30 | grep -v '^[a-f0-9]' | sort | uniq -c | sort -rn | head -15

# Project config
cat package.json 2>/dev/null | head -30
```

4. Note the domain distribution of existing workers (what domains are workers experienced in).

5. Start the allocator loop with the codex10 runbook:
   - Use `.claude/commands-codex10/allocate-loop.md` entrypoint and codex10-only commands.
   - Do **not** use legacy `.claude/commands/allocate-loop.md` (mac10/file-queue path).
