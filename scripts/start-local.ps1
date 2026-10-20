param([string]$JdkPath='C:/Program Files/Java/jdk-1.8',[string]$MavenPath='D:/code/apache-maven-3.9.16')
$ErrorActionPreference='Stop'
$webRoot=Split-Path -Parent $PSScriptRoot
$workspaceRoot=Split-Path -Parent $webRoot
$adminRoot=Join-Path $workspaceRoot 'cy-pregnancy-admin/server'
$userRoot=Join-Path $workspaceRoot 'cy-pregnancy-server'
$logRoot=Join-Path $webRoot '.local'
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $adminRoot '.local') -Force | Out-Null
# Shared internal key is generated before either service starts. Never print it.
$keyFile=Join-Path $adminRoot '.local/user-read-key.txt'
if(!(Test-Path -LiteralPath $keyFile)){
 $bytes=New-Object byte[] 48
 $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
 try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
 [IO.File]::WriteAllText($keyFile,[Convert]::ToBase64String($bytes))
}
$env:ADMIN_READ_KEY=[IO.File]::ReadAllText($keyFile).Trim()
$contentKeyFile=Join-Path $adminRoot '.local/content-read-key.txt'
if(!(Test-Path -LiteralPath $contentKeyFile)){
 $bytes=New-Object byte[] 48
 $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
 try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
 [IO.File]::WriteAllText($contentKeyFile,[Convert]::ToBase64String($bytes))
}
$env:CONTENT_READ_KEY=[IO.File]::ReadAllText($contentKeyFile).Trim()
$shellPath=(Get-Process -Id $PID).Path
$targets=@(
 @{name='admin';port=18732;script=(Join-Path $adminRoot 'scripts/dev.ps1');args=@('-Task','run','-JdkPath',$JdkPath,'-MavenPath',$MavenPath)},
 @{name='user';port=18731;script=(Join-Path $userRoot 'scripts/dev.ps1');args=@('-Task','run','-JdkPath',$JdkPath,'-MavenPath',$MavenPath)},
 @{name='web';port=5174;script=(Join-Path $PSScriptRoot 'run-vite.ps1');args=@()}
 ,@{name='app';port=5173;script=(Join-Path $PSScriptRoot 'run-app.ps1');args=@()}
)
foreach($target in $targets){
 if(Get-NetTCPConnection -State Listen -LocalPort $target.port -ErrorAction SilentlyContinue){Write-Output "$($target.name): port $($target.port) already listening; skipped";continue}
 # Start-Process joins arguments as a command line, so explicitly quote paths containing spaces.
 $arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$target.script+'"'))
 foreach($arg in $target.args){$arguments+=('"'+$arg+'"')}
 $process=Start-Process -FilePath $shellPath -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot ($target.name+'.out.log')) -RedirectStandardError (Join-Path $logRoot ($target.name+'.err.log'))
 Write-Output "$($target.name): starting, launcher PID $($process.Id)"
}
Write-Output 'Web: http://127.0.0.1:5174 ; App H5: http://127.0.0.1:5173 ; logs: web/.local/*.log'
