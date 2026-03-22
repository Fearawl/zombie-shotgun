$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$versionFile = Join-Path $root "src\\version.js"

if (-not (Test-Path $versionFile)) {
  throw "Version file not found: $versionFile"
}

$content = Get-Content $versionFile -Raw
$match = [regex]::Match($content, 'GAME_VERSION = "v(\d+)"')

if (-not $match.Success) {
  throw "Could not parse GAME_VERSION in $versionFile"
}

$nextNumber = [int]$match.Groups[1].Value + 1
$nextVersion = "v{0:D3}" -f $nextNumber
$updated = [regex]::Replace($content, 'GAME_VERSION = "v\d+"', "GAME_VERSION = `"$nextVersion`"")

Set-Content -Path $versionFile -Value $updated -NoNewline
Write-Output $nextVersion
