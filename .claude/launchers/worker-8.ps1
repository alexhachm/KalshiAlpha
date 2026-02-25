# DO NOT add non-ASCII chars or inline bash -lc strings. PowerShell 5.1 reads without UTF-8 BOM.
Clear-Host
Write-Host "  I AM WORKER-8 (Opus)" -ForegroundColor Green
wsl.exe bash -l /mnt/c/Users/Owner/Desktop/KalshiAlpha/.claude/launchers/worker-8.sh
