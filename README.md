# Gachi Rewards

Shopify referral engine app that enables viral growth through automatic referral link generation.

## Features

- **Automatic Referral Links**: Every customer gets a referral link after purchase
- **Secure One-Time Links**: Safe links prevent coupon code scraping
- **Multi-Tenant Support**: One database, multiple Shopify stores
- **App Proxy Security**: Customer-facing APIs secured via Shopify App Proxy

## Quick Start

### ⚡ Fastest Way to Get Started

See **[QUICK-START.md](./QUICK-START.md)** for a **5-minute setup guide** to get running locally and testing right away! ⭐

### For Local Development

See **[QUICK-START.md](./QUICK-START.md)** for quick setup guide.

Quick steps:
1. Install dependencies: `npm install`
2. Set up database (SQLite or PostgreSQL)
3. Create `.env` file with Shopify credentials
4. Run migrations: `npm run db:migrate`
5. Start dev server: `npm run dev`

## Documentation

- **[QUICK-START.md](./QUICK-START.md)** - **🚀 5-minute quick start guide** ⭐

### Deploy Shopify Extensions

```bash
shopify app deploy
```

## Tech Stack

- **Framework**: React Router
- **Database**: Prisma + SQLite (local) or PostgreSQL
- **Shopify**: App Bridge, Checkout UI Extensions, Theme App Extensions

## Project Structure

```
gachi-rewards/
├── app/                    # Application code
│   ├── routes/            # API routes and pages
│   └── services/          # Business logic
├── extensions/            # Shopify extensions
│   ├── thank-you-referral/
│   ├── checkout-discount-applier/
│   └── storefront-script/
├── prisma/                # Database schema & migrations
└── public/                # Static assets
```

## Environment Variables

Required environment variables:

- `SHOPIFY_API_KEY` - Your Shopify app API key
- `SHOPIFY_API_SECRET` - Your Shopify app secret
- `SHOPIFY_APP_URL` - Your app URL (use `http://localhost:3000` for local)
- `SCOPES` - Comma-separated Shopify scopes
- `DATABASE_URL` - Database connection string
  - **Local (SQLite)**: `file:./prisma/dev.sqlite`
  - **Local (PostgreSQL)**: `postgresql://user:password@localhost:5432/dbname`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Storefront API access token (for cart metafields)
- `NODE_ENV` - Set to `development` for local development

## License

Private - All rights reserved
