param(
  [string]$ComposeFile = "docker-compose.yml"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    return
  }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $parts = $trimmed.Split("=", 2)
    if ($parts.Length -eq 2 -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($parts[0]))) {
      [Environment]::SetEnvironmentVariable($parts[0], $parts[1], "Process")
    }
  }
}

Read-EnvFile ".env"

$postgresUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "fanfuel" }
$postgresDb = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "fanfuel" }
$migrationDir = "infra/migrations"

docker compose -f $ComposeFile up -d postgres | Out-Host

docker compose -f $ComposeFile exec -T postgres psql -U $postgresUser -d $postgresDb -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());" | Out-Host

Get-ChildItem $migrationDir -Filter "*.up.sql" | Sort-Object Name | ForEach-Object {
  $version = $_.Name -replace "\.up\.sql$", ""
  $applied = docker compose -f $ComposeFile exec -T postgres psql -U $postgresUser -d $postgresDb -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version';"
  $appliedText = if ($null -eq $applied) { "" } else { ($applied -join "").Trim() }

  if ($appliedText -eq "1") {
    Write-Host "migration $version already applied"
    return
  }

  Write-Host "applying migration $version"
  Get-Content -Raw $_.FullName | docker compose -f $ComposeFile exec -T postgres psql -U $postgresUser -d $postgresDb -v ON_ERROR_STOP=1 | Out-Host
  docker compose -f $ComposeFile exec -T postgres psql -U $postgresUser -d $postgresDb -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (version) VALUES ('$version');" | Out-Host
}
