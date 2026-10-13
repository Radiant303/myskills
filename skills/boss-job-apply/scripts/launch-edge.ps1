<#
  Launch a debuggable Microsoft Edge window for the BOSS直聘 automation scripts.

  Uses a dedicated profile so the automation never touches the user's normal
  browsing session. The user logs in to BOSS直聘 inside this window.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/launch-edge.ps1
    powershell -ExecutionPolicy Bypass -File scripts/launch-edge.ps1 -Port 9222 -ProfileDir "D:\temp\edge-cdp"
#>
param(
  [int]$Port = 9222,
  [string]$ProfileDir = "$env:TEMP\boss-job-apply-edge",
  [string]$StartUrl = "https://www.zhipin.com/web/geek/jobs"
)

$edge = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $edge) { Write-Error "Microsoft Edge not found. Install Edge or edit this script."; exit 1 }

New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

Write-Host "Launching Edge with remote debugging on port $Port"
Write-Host "Profile: $ProfileDir"
& $edge --remote-debugging-port=$Port --user-data-dir="$ProfileDir" --new-window "$StartUrl"

Start-Sleep -Seconds 6
try {
  $version = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/version" -TimeoutSec 5
  Write-Host "CDP ready: $($version.Browser)"
  Write-Host "Now log in to BOSS直聘 in the opened window, then run the collector."
} catch {
  Write-Warning "CDP not reachable yet on port $Port. Wait a few seconds and retry, or check the Edge window."
}
