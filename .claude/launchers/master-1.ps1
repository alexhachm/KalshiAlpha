# v4 self-contained launcher for master-1
# DO NOT add non-ASCII chars. PowerShell 5.1 reads without UTF-8 BOM.
param([switch]$Continue)

# Derive project root from this script location (launchers/ is inside .claude/)
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
# Convert Windows path to WSL path in pure PowerShell (avoids wsl.exe backslash-eating bug)
$WslProject = '/mnt/' + $ProjectDir.Substring(0,1).ToLower() + $ProjectDir.Substring(2).Replace('\','/')

Clear-Host
if ($Continue) {
    Write-Host "  I AM MASTER-1 -- YOUR INTERFACE (Sonnet) [CONTINUE]" -ForegroundColor Cyan
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && claude --continue --model sonnet --dangerously-skip-permissions"
} else {
    Write-Host "  I AM MASTER-1 -- YOUR INTERFACE (Sonnet)" -ForegroundColor Cyan
    wsl.exe bash -lc "export PATH=`"`$HOME/bin:`$HOME/.local/bin:`$PATH`"; cd '$WslProject' && claude --model sonnet --dangerously-skip-permissions '/master-loop'"
}
