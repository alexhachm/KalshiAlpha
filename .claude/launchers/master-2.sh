#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
clear
echo ""
echo "  ████  I AM MASTER-2 — ARCHITECT (Opus)  ████"
echo ""
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --model opus --dangerously-skip-permissions '/scan-codebase'
