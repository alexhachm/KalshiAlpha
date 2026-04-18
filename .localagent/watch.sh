#!/usr/bin/env bash
# Continuous query watcher: pulls latest localagent branch and emits new tasks.
# Designed to be invoked by the Claude /loop harness OR run standalone.
#
# Behavior per call:
#   1. git fetch origin localagent (fast)
#   2. git pull --ff-only origin localagent (if on localagent branch)
#   3. run audit.py and print JSON list of NEW tasks
#
# Standalone mode (--watch): loops forever with a 15s sleep.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

audit_once() {
  git fetch --quiet origin localagent || true
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
  if [ "$branch" = "localagent" ]; then
    git pull --ff-only --quiet origin localagent || true
  fi
  python3 "$ROOT/.localagent/audit.py"
}

if [ "${1:-}" = "--watch" ]; then
  echo "[watch] polling localagent.md every 15s (Ctrl-C to stop)" >&2
  while true; do
    out="$(audit_once)"
    # Only print when there is at least one task
    if [ "$out" != "[]" ]; then
      echo "$out"
    fi
    sleep 15
  done
else
  audit_once
fi
