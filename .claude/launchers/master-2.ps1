# v4 self-contained launcher for master-2
# DO NOT add non-ASCII chars. PowerShell 5.1 reads without UTF-8 BOM.
param([switch]$Continue)

# Derive project root from this script location (launchers/ is inside .claude/)
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
# Convert Windows path to WSL path in pure PowerShell (avoids wsl.exe backslash-eating bug)
$WslProject = '/mnt/' + $ProjectDir.Substring(0,1).ToLower() + $ProjectDir.Substring(2).Replace('\','/')

Clear-Host
if ($Continue) {
    Write-Host "  I AM MASTER-2 -- ARCHITECT (Opus) [CONTINUE]" -ForegroundColor Cyan
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --continue --model opus --dangerously-skip-permissions"
} else {
    Write-Host "  I AM MASTER-2 -- ARCHITECT (Opus)" -ForegroundColor Cyan
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model opus --dangerously-skip-permissions '/scan-codebase'"
}
