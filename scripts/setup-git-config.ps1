# Git Configuration Setup Script
# Run this script to configure git with the correct user name and email for Vercel deployments

Write-Host "Setting up git configuration..." -ForegroundColor Cyan

# Set global git user name
git config --global user.name "rkim412"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Git user name set to: rkim412" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set git user name" -ForegroundColor Red
    exit 1
}

# Set global git user email
git config --global user.email "rkim412@gmail.com"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Git user email set to: rkim412@gmail.com" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set git user email" -ForegroundColor Red
    exit 1
}

# Verify configuration
Write-Host "`nVerifying configuration..." -ForegroundColor Cyan
$name = git config --global user.name
$email = git config --global user.email

Write-Host "Current git config:" -ForegroundColor Yellow
Write-Host "  User name: $name" -ForegroundColor White
Write-Host "  User email: $email" -ForegroundColor White

if ($name -eq "rkim412" -and $email -eq "rkim412@gmail.com") {
    Write-Host "`n✓ Git configuration is correct!" -ForegroundColor Green
    Write-Host "All future commits will use this author information." -ForegroundColor Gray
} else {
    Write-Host "`n✗ Git configuration verification failed" -ForegroundColor Red
    exit 1
}

