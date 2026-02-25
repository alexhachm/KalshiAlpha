#!/usr/bin/env bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
clear
echo ""
echo "  ████  I AM MASTER-3 — ALLOCATOR (Sonnet)  ████"
echo ""
cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --model sonnet --dangerously-skip-permissions '/scan-codebase-allocator'
