#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
printf "\n  ████  I AM WORKER-4 (Opus)  ████\n\n"
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-4' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --model opus --dangerously-skip-permissions '/worker-loop'
