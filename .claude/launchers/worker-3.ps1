# DO NOT add non-ASCII chars or inline bash -lc strings. PowerShell 5.1 reads without UTF-8 BOM.
Clear-Host
Write-Host "  I AM WORKER-3 (Opus)" -ForegroundColor Green
wsl.exe bash -l /worker-3.sh
