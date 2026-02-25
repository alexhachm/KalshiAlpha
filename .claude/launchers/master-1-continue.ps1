# DO NOT add non-ASCII chars or inline bash -lc strings. PowerShell 5.1 reads without UTF-8 BOM.
Clear-Host
Write-Host "  I AM MASTER-1 -- YOUR INTERFACE (Sonnet) [CONTINUE]" -ForegroundColor Cyan
wsl.exe bash -l /mnt/c/Users/Owner/Desktop/KalshiAlpha/.claude/launchers/master-1-continue.sh
