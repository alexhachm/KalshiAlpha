# v4 self-contained launcher for worker-2
# DO NOT add non-ASCII chars. PowerShell 5.1 reads without UTF-8 BOM.
param([switch]$Continue)

# Derive project root from this script location (launchers/ is inside .claude/)
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$WslProject = (wsl.exe wslpath -u "$ProjectDir").Trim()

Clear-Host
if ($Continue) {
    Write-Host "  I AM WORKER-2 (Opus) [CONTINUE]" -ForegroundColor Green
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject/.worktrees/wt-2' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --continue --model opus --dangerously-skip-permissions"
} else {
    Write-Host "  I AM WORKER-2 (Opus)" -ForegroundColor Green
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject/.worktrees/wt-2' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model opus --dangerously-skip-permissions '/worker-loop'"
}
