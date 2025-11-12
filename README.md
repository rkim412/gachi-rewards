# Gachi Rewards

Shopify referral engine app that enables viral growth through automatic referral link generation.

## Features

- **Automatic Referral Links**: Every customer gets a referral link after purchase
- **Secure One-Time Links**: Safe links prevent coupon code scraping
- **Multi-Tenant Support**: One database, multiple Shopify stores
- **App Proxy Security**: Customer-facing APIs secured via Shopify App Proxy

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Shopify API credentials
   - Add database connection string

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Start development:
   ```bash
   npm run dev
   ```

## Deployment

### Deploy to Vercel

1. Import this repository to Vercel
2. Create Vercel Postgres database
3. Add environment variables:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_APP_URL` (your Vercel URL)
   - `SCOPES` (see `shopify.app.toml`)
   - `DATABASE_URL` (use `POSTGRES_PRISMA_URL` from Vercel)
   - `NODE_ENV=production`
4. Deploy - migrations run automatically

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
- `NODE_ENV` - Set to `production` for production

## License

Private - All rights reserved
