param([string]$ProjectRoot = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'app/cy-pregnancy'))
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $ProjectRoot
& npm.cmd run dev:h5
exit $LASTEXITCODE
