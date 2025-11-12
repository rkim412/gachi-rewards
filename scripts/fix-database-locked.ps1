# Fix SQLite "database is locked" error
# Usage: .\scripts\fix-database-locked.ps1

Write-Host "🔧 Fixing SQLite database locked error..." -ForegroundColor Cyan
Write-Host ""

# Check if Prisma Studio is running
Write-Host "Checking for running processes..." -ForegroundColor Yellow
$studioProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*prisma*studio*" }
if ($studioProcess) {
    Write-Host "⚠️  Prisma Studio is running. Please close it first (Ctrl+C in the terminal running it)." -ForegroundColor Yellow
    Write-Host ""
}

# Delete lock files
Write-Host "Removing SQLite lock files..." -ForegroundColor Yellow

$lockFiles = @(
    "prisma\dev.sqlite-wal",
    "prisma\dev.sqlite-shm"
)

$removed = $false
foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Removed: $file" -ForegroundColor Green
        $removed = $true
    }
}

if (-not $removed) {
    Write-Host "ℹ️  No lock files found." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Database lock files cleaned up!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure Prisma Studio is closed (if it was running)" -ForegroundColor White
Write-Host "2. Make sure dev server is stopped (if it was running)" -ForegroundColor White
Write-Host "3. Run: npm run db:migrate" -ForegroundColor White
Write-Host ""

