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

See **[SETUP-LOCAL.md](./SETUP-LOCAL.md)** for complete local development setup guide.

Quick steps:
1. Install dependencies: `npm install`
2. Set up database (SQLite or PostgreSQL)
3. Create `.env` file with Shopify credentials
4. Run migrations: `npm run db:migrate`
5. Start dev server: `npm run dev`

### For Production Deployment

See **[SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md)** for complete Vercel deployment guide.

Quick steps:
1. Push code to GitHub
2. Import to Vercel
3. Create Vercel Postgres database
4. Add environment variables
5. Deploy!

## Setup Guides

- **[QUICK-START.md](./QUICK-START.md)** - **🚀 5-minute quick start: Get running locally and testing right away!** ⭐
- **[LOCALHOST-URL-SETUP.md](./LOCALHOST-URL-SETUP.md)** - **🔗 Complete guide to setting up localhost and tunnel URLs**
- **[SETUP-LOCAL.md](./SETUP-LOCAL.md)** - Complete guide for local development with SQLite/PostgreSQL
- **[DEPLOY-AND-TEST.md](./DEPLOY-AND-TEST.md)** - Deploy and test in Shopify
- **[SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md)** - Complete guide for Vercel production deployment

## Testing Guides

- **[TEST-REFERRAL-LOOP.md](./TEST-REFERRAL-LOOP.md)** - **🧪 Complete guide to testing the referral loop end-to-end** ⭐
- **[TESTING-QUICK-REFERENCE.md](./TESTING-QUICK-REFERENCE.md)** - Quick reference for common testing scenarios
- **[FIX-DATABASE-ERRORS.md](./FIX-DATABASE-ERRORS.md)** - Troubleshooting database and import errors

## Deployment

### Local Development
Follow **[SETUP-LOCAL.md](./SETUP-LOCAL.md)** to set up local development environment.

### Production (Vercel)
Follow **[SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md)** for step-by-step Vercel deployment.

### Deploy Shopify Extensions

```bash
shopify app deploy
```

## Tech Stack

- **Framework**: React Router
- **Database**: Prisma + PostgreSQL
- **Hosting**: Vercel
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
- `SHOPIFY_APP_URL` - Your app URL (e.g., `https://your-app.vercel.app`)
- `SCOPES` - Comma-separated Shopify scopes
- `DATABASE_URL` - PostgreSQL connection string
  - **For Vercel**: Use `POSTGRES_PRISMA_URL` from Vercel Postgres database
- `NODE_ENV` - Set to `production` for production

## License

Private - All rights reserved
