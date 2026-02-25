#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
clear
printf '\n\033[1;43m\033[1;30m  ████  I AM MASTER-3 — ALLOCATOR (Sonnet)  ████  \033[0m\n\n'
cd '/c/Users/Owner/Desktop/KalshiAlpha'
exec env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model sonnet --dangerously-skip-permissions '/scan-codebase-allocator'
