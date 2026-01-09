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

### For Production Deployment

See **[VERCEL-SETUP-CHECKLIST.md](./VERCEL-SETUP-CHECKLIST.md)** for complete Vercel deployment checklist.

Quick steps:
1. Push code to GitHub
2. Import to Vercel
3. Create Vercel Postgres database
4. Add environment variables
5. Deploy!

## Documentation

- **[QUICK-START.md](./QUICK-START.md)** - **🚀 5-minute quick start guide** ⭐
- **[VERCEL-SETUP-CHECKLIST.md](./VERCEL-SETUP-CHECKLIST.md)** - **✅ Complete Vercel deployment checklist**

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
- `DATABASE_URL` - Prisma Accelerate connection string (prisma://…)
  - **Production**: Create an Accelerate API key at https://cloud.prisma.io and copy the prisma:// URL
  - **Local**: Use `file:./prisma/dev.sqlite` or a local Postgres connection string
- `DIRECT_DATABASE_URL` - Raw Postgres connection string (required when `DATABASE_URL` is prisma://)
  - Copy from Vercel Postgres → Connection string → `postgres://…`
- `NODE_ENV` - Set to `production` for production

## License

Private - All rights reserved
