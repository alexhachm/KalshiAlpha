# v4 self-contained launcher for master-1
# DO NOT add non-ASCII chars. PowerShell 5.1 reads without UTF-8 BOM.
param([switch]$Continue)

# Derive project root from this script location (launchers/ is inside .claude/)
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$WslProject = (wsl.exe wslpath -u "$ProjectDir").Trim()

Clear-Host
if ($Continue) {
    Write-Host "  I AM MASTER-1 -- YOUR INTERFACE (Sonnet) [CONTINUE]" -ForegroundColor Cyan
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && claude --continue --model sonnet --dangerously-skip-permissions"
} else {
    Write-Host "  I AM MASTER-1 -- YOUR INTERFACE (Sonnet)" -ForegroundColor Cyan
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && claude --model sonnet --dangerously-skip-permissions '/master-loop'"
}
