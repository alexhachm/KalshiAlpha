Clear-Host
Write-Host "`n  ████  I AM WORKER-4 (Opus)  ████`n" -ForegroundColor Cyan
& wsl.exe -e bash -lc "cd '/mnt/c/Users/Owner/Desktop/KalshiAlpha/.worktrees/wt-4' && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && exec claude --model opus --dangerously-skip-permissions '/worker-loop'"
