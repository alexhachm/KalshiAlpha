#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
printf "\n  ████  I AM WORKER-5 (Opus) [CONTINUE]  ████\n\n"
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-5' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --continue --model opus --dangerously-skip-permissions
