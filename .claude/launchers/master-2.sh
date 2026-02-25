#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
clear
printf '\n\033[1;45m\033[1;37m  ████  I AM MASTER-2 — ARCHITECT (Opus)  ████  \033[0m\n\n'
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha'
exec env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model opus --dangerously-skip-permissions '/scan-codebase'
