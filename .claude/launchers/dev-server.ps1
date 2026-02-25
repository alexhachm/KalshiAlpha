# Dev server launcher -- starts Vite dev server via WSL
# Double-click from Windows to launch the app in your browser.
# DO NOT add non-ASCII chars. PowerShell 5.1 reads without UTF-8 BOM.

# Derive project root from this script location (launchers/ is inside .claude/)
$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..").Path
# Convert Windows path to WSL path in pure PowerShell (avoids wsl.exe backslash-eating bug)
$WslProject = '/mnt/' + $ProjectDir.Substring(0,1).ToLower() + $ProjectDir.Substring(2).Replace('\','/')

Clear-Host
Write-Host "  KALSHI ALPHA -- Dev Server" -ForegroundColor Yellow
Write-Host "  Starting Vite dev server..." -ForegroundColor Gray
Write-Host ""

# Run npm run dev via WSL bash login shell (ensures node/npm are on PATH)
wsl.exe bash -lc "cd '$WslProject' && npm run dev -- --host"
