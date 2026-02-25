#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
clear
echo ""
echo "  ████  I AM WORKER-3 (Opus)  ████"
echo ""
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-3' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --model opus --dangerously-skip-permissions '/worker-loop'
