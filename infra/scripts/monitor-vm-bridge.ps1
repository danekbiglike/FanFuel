param(
    [string]$ConfigPath = 'C:\ProgramData\FanFuel\vm-bridge-monitor.json'
)

$ErrorActionPreference = 'Stop'

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$ssh = 'C:\Windows\System32\OpenSSH\ssh.exe'

function Invoke-SshProbe($target, $command) {
    $arguments = @(
        '-i', $target.key,
        '-o', 'BatchMode=yes',
        '-o', 'StrictHostKeyChecking=yes',
        '-o', 'ConnectTimeout=5',
        '-o', 'ConnectionAttempts=1',
        '-o', "UserKnownHostsFile=$($target.knownHosts)",
        '-p', [string]$target.port,
        "$($target.user)@$($target.host)",
        $command
    )

    & $ssh @arguments 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

$edgeSsh = Invoke-SshProbe $config.edge 'true'
$edgeRouter = $false
if ($edgeSsh) {
    $edgeRouter = Invoke-SshProbe $config.edge "ping -c 1 -W 2 $($config.router)"
}

$appSsh = Invoke-SshProbe $config.app 'true'
$appRouter = $false
if ($appSsh) {
    $appRouter = Invoke-SshProbe $config.app "ping -I enp0s8 -c 1 -W 2 $($config.router)"
}

$healthy = $edgeSsh -and $edgeRouter -and $appSsh -and $appRouter
$previousFailures = 0
if (Test-Path -LiteralPath $config.statePath) {
    try {
        $previous = Get-Content -LiteralPath $config.statePath -Raw | ConvertFrom-Json
        $previousFailures = [int]$previous.consecutiveFailures
    } catch {
        $previousFailures = 0
    }
}

$failures = if ($healthy) { 0 } else { $previousFailures + 1 }
$status = if ($healthy) { 'healthy' } elseif ($failures -ge 2) { 'alert' } else { 'degraded' }
$snapshot = [ordered]@{
    checkedAt = (Get-Date).ToUniversalTime().ToString('o')
    status = $status
    consecutiveFailures = $failures
    edgeSsh = [bool]$edgeSsh
    edgeRouter = [bool]$edgeRouter
    appSsh = [bool]$appSsh
    appRouter = [bool]$appRouter
}

$temporaryPath = "$($config.statePath).tmp"
$json = $snapshot | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($temporaryPath, $json, [System.Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $temporaryPath -Destination $config.statePath -Force

if (-not $healthy) { exit 1 }
