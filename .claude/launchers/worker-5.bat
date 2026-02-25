@echo off
cls
echo.
echo   ████  I AM WORKER-5 (Opus)  ████
echo.
wsl.exe -e bash -lc "cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-5' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --model opus --dangerously-skip-permissions '/worker-loop'"
