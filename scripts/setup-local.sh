#!/bin/bash
# Quick setup script for local development
# Usage: bash scripts/setup-local.sh

set -e

echo "🚀 Setting up Gachi Rewards for local development..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Local Development Environment Variables
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
EOF
    echo "✅ Created .env file - Please update with your Shopify credentials"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npm run db:generate

# Ask about database
echo ""
echo "Which database do you want to use?"
echo "1) SQLite (easiest, no setup needed)"
echo "2) PostgreSQL (more production-like)"
read -p "Enter choice [1-2]: " db_choice

if [ "$db_choice" = "1" ]; then
    echo ""
    echo "📊 Setting up SQLite database..."
    # Check if schema needs to be updated for SQLite
    if grep -q "provider = \"postgresql\"" prisma/schema.prisma; then
        echo "⚠️  Note: You'll need to temporarily update prisma/schema.prisma to use SQLite"
        echo "   See prisma/schema.local.sqlite.prisma for reference"
    fi
    npm run db:migrate
elif [ "$db_choice" = "2" ]; then
    echo ""
    echo "📊 Setting up PostgreSQL database..."
    echo "⚠️  Make sure PostgreSQL is running and database is created"
    echo "   Update DATABASE_URL in .env to: postgresql://postgres:postgres@localhost:5432/gachi_rewards"
    read -p "Press enter when ready to run migrations..."
    npm run db:migrate
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Shopify API credentials"
echo "2. Run: npm run dev"
echo "3. Deploy extensions: shopify app deploy"
echo ""
echo "For detailed instructions, see SETUP-LOCAL.md"

