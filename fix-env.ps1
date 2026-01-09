# Script to fix .env file with correct DATABASE_URL format
$envPath = Join-Path $PSScriptRoot ".env"

# Check if .env exists
if (Test-Path $envPath) {
    Write-Host "Found .env file, updating DATABASE_URL..." -ForegroundColor Green
    
    # Read current content
    $content = Get-Content $envPath -Raw
    
    # Remove quotes from DATABASE_URL if present
    $content = $content -replace 'DATABASE_URL="([^"]+)"', 'DATABASE_URL=$1'
    $content = $content -replace "DATABASE_URL='([^']+)'", 'DATABASE_URL=$1'
    
    # Remove spaces around = sign
    $content = $content -replace 'DATABASE_URL\s*=\s*', 'DATABASE_URL='
    
    # Ensure DATABASE_URL is set to Neon connection string
    $neonUrl = "postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
    
    if ($content -match 'DATABASE_URL=(.+)') {
        # Replace existing DATABASE_URL
        $content = $content -replace 'DATABASE_URL=[^\r\n]+', "DATABASE_URL=$neonUrl"
        Write-Host "Updated existing DATABASE_URL" -ForegroundColor Yellow
    } else {
        # Add DATABASE_URL if it doesn't exist
        if (-not ($content -match 'DATABASE_URL')) {
            $content += "`n# Database - Neon PostgreSQL`nDATABASE_URL=$neonUrl`n"
            Write-Host "Added DATABASE_URL" -ForegroundColor Yellow
        }
    }
    
    # Write back to file
    Set-Content -Path $envPath -Value $content -NoNewline
    
    Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
    Write-Host "`nVerifying DATABASE_URL format..." -ForegroundColor Cyan
    
    # Verify the format
    $newContent = Get-Content $envPath
    $dbLine = $newContent | Select-String "DATABASE_URL="
    if ($dbLine) {
        Write-Host $dbLine -ForegroundColor White
        if ($dbLine -match '^DATABASE_URL=postgresql://') {
            Write-Host "✅ Format is correct!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Format might still be incorrect" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host ".env file not found. Creating new one..." -ForegroundColor Yellow
    
    $neonUrl = "postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
    
    $envContent = @"
# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here

# App URL
SHOPIFY_APP_URL=https://gachi-rewards.vercel.app

# Scopes
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy

# Database - Neon PostgreSQL
DATABASE_URL=$neonUrl

# Webhook Secret (Optional)
WEBHOOK_SECRET=your_webhook_secret_here

# Node Environment
NODE_ENV=development
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Created .env file with correct DATABASE_URL!" -ForegroundColor Green
}

Write-Host "`nYou can now run: npx prisma migrate deploy" -ForegroundColor Cyan
