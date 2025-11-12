# Script to restore DATABASE_URL in .env file
Write-Host "=========================================="
Write-Host "Restore DATABASE_URL in .env file"
Write-Host "=========================================="
Write-Host ""

$envFile = ".env"

# Get database connection string from user
Write-Host "Please provide your PostgreSQL connection string:"
Write-Host ""
Write-Host "For Vercel Postgres:"
Write-Host "  Get from: Vercel Dashboard → Your Project → Storage → Postgres → .env.local"
Write-Host "  Use the POSTGRES_PRISMA_URL value"
Write-Host "  Format: postgresql://default:[PASSWORD]@[HOST]:5432/verceldb?sslmode=require"
Write-Host ""
Write-Host "For local development:"
Write-Host "  Format: postgresql://postgres:postgres@localhost:5432/gachi_rewards"
Write-Host ""

$connectionString = Read-Host "Paste your connection string here"

if ([string]::IsNullOrWhiteSpace($connectionString)) {
    Write-Host "❌ No connection string provided"
    exit 1
}

# Validate it starts with postgresql://
if (-not $connectionString.StartsWith("postgresql://") -and -not $connectionString.StartsWith("postgres://")) {
    Write-Host "❌ Invalid connection string format. Must start with postgresql:// or postgres://"
    exit 1
}

# Read .env file
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!"
    exit 1
}

$lines = Get-Content $envFile
$newLines = @()
$updated = $false

foreach ($line in $lines) {
    if ($line -match "^DATABASE_URL=") {
        $newLines += "DATABASE_URL=$connectionString"
        $updated = $true
        Write-Host "✅ Updated DATABASE_URL"
    } else {
        $newLines += $line
    }
}

# If DATABASE_URL wasn't found, add it
if (-not $updated) {
    $newLines += "DATABASE_URL=$connectionString"
    Write-Host "✅ Added DATABASE_URL"
}

# Write back to file
Set-Content -Path $envFile -Value ($newLines -join "`n")

Write-Host ""
Write-Host "✅ .env file updated successfully!"
Write-Host ""

