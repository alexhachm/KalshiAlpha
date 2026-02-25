# v4 self-contained launcher for master-3
# DO NOT add non-ASCII chars. PowerShell 5.1 reads without UTF-8 BOM.
param([switch]$Continue)

# Derive project root from this script location (launchers/ is inside .claude/)
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$WslProject = (wsl.exe wslpath -u "$ProjectDir").Trim()

Clear-Host
if ($Continue) {
    Write-Host "  I AM MASTER-3 -- ALLOCATOR (Sonnet) [CONTINUE]" -ForegroundColor Yellow
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --continue --model sonnet --dangerously-skip-permissions"
} else {
    Write-Host "  I AM MASTER-3 -- ALLOCATOR (Sonnet)" -ForegroundColor Yellow
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model sonnet --dangerously-skip-permissions '/scan-codebase-allocator'"
}
