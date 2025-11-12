# Quick setup script for local development (PowerShell)
# Usage: .\scripts\setup-local.ps1

Write-Host "🚀 Setting up Gachi Rewards for local development..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
# Local Development Environment Variables
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ Created .env file - Please update with your Shopify credentials" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma client
Write-Host ""
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate

# Ask about database
Write-Host ""
Write-Host "Which database do you want to use?" -ForegroundColor Cyan
Write-Host "1) SQLite (easiest, no setup needed)"
Write-Host "2) PostgreSQL (more production-like)"
$dbChoice = Read-Host "Enter choice [1-2]"

if ($dbChoice -eq "1") {
    Write-Host ""
    Write-Host "📊 Setting up SQLite database..." -ForegroundColor Yellow
    # Check if schema needs to be updated for SQLite
    $schemaContent = Get-Content prisma/schema.prisma -Raw
    if ($schemaContent -match 'provider = "postgresql"') {
        Write-Host "⚠️  Note: You'll need to temporarily update prisma/schema.prisma to use SQLite" -ForegroundColor Yellow
        Write-Host "   See prisma/schema.local.sqlite.prisma for reference" -ForegroundColor Yellow
    }
    npm run db:migrate
} elseif ($dbChoice -eq "2") {
    Write-Host ""
    Write-Host "📊 Setting up PostgreSQL database..." -ForegroundColor Yellow
    Write-Host "⚠️  Make sure PostgreSQL is running and database is created" -ForegroundColor Yellow
    Write-Host "   Update DATABASE_URL in .env to: postgresql://postgres:postgres@localhost:5432/gachi_rewards" -ForegroundColor Yellow
    Read-Host "Press enter when ready to run migrations..."
    npm run db:migrate
} else {
    Write-Host "❌ Invalid choice" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env with your Shopify API credentials"
Write-Host "2. Run: npm run dev"
Write-Host "3. Deploy extensions: shopify app deploy"
Write-Host ""
Write-Host "For detailed instructions, see SETUP-LOCAL.md" -ForegroundColor Cyan

