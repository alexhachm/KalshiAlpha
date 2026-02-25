# DO NOT add non-ASCII chars or inline bash -lc strings. PowerShell 5.1 reads without UTF-8 BOM.
Clear-Host
Write-Host "  I AM MASTER-2 -- ARCHITECT (Opus)" -ForegroundColor Cyan
wsl.exe bash -l /master-2.sh
