@echo off
cls
echo.
echo   ████  I AM WORKER-6 (Opus) [CONTINUE]  ████
echo.
wsl.exe -e bash -lc "cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-6' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --continue --model opus --dangerously-skip-permissions"
