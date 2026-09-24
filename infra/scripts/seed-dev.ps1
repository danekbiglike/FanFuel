param(
  [string]$ComposeFile = "docker-compose.yml"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)
  if (!(Test-Path $Path)) { return }
  foreach ($line in Get-Content $Path) {
    $trim = $line.Trim()
    if ($trim.Length -eq 0 -or $trim.StartsWith("#")) { continue }
    $parts = $trim.Split("=", 2)
    if ($parts.Length -eq 2 -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($parts[0]))) {
      [Environment]::SetEnvironmentVariable($parts[0], $parts[1], "Process")
    }
  }
}

Read-EnvFile ".env"
$postgresUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "fanfuel" }
$postgresDb = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "fanfuel" }

docker compose -f $ComposeFile up -d postgres | Out-Host
Get-Content -Raw "infra/scripts/seed-demo-catalog.sql" |
  docker compose -f $ComposeFile exec -T postgres psql -U $postgresUser -d $postgresDb -v ON_ERROR_STOP=1 |
  Out-Host
