param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $ProjectRoot
& npm.cmd run dev
exit $LASTEXITCODE
