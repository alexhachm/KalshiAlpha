#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
clear
printf '\n\033[1;44m\033[1;37m  ████  I AM WORKER-2 (Opus) [CONTINUE]  ████  \033[0m\n\n'
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-2'
exec env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --continue --model opus --dangerously-skip-permissions
