# Gachi Rewards - Project Structure Summary

Complete overview of how the Gachi Rewards Shopify app is organized and structured.

---

## 📁 Project Overview

**Gachi Rewards** is a Shopify referral engine app built with:
- **Framework**: React Router v7 (server-side rendering)
- **Database**: Prisma ORM with PostgreSQL (production) / SQLite (local dev)
- **Hosting**: Vercel (production)
- **Shopify Integration**: App Bridge, Checkout UI Extensions, Theme App Extensions

---

## 🏗️ Directory Structure

```
gachi-rewards/
├── app/                          # Main application code
│   ├── routes/                   # React Router routes (file-based routing)
│   ├── services/                 # Business logic services
│   ├── db.server.js             # Prisma database client
│   ├── shopify.server.js         # Shopify authentication & API setup
│   ├── entry.server.jsx          # Server entry point
│   └── root.jsx                  # Root React component
│
├── extensions/                   # Shopify extensions (deployed separately)
│   ├── thank-you-referral/      # Thank You page extension
│   ├── checkout-discount-applier/ # Checkout discount extension
│   └── storefront-script/       # Theme app extension
│
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma            # Main schema (PostgreSQL for production)
│   ├── schema.local.sqlite.prisma # Reference for SQLite local dev
│   └── migrations/              # Database migration files
│
├── public/                       # Static assets
├── scripts/                      # Utility scripts
└── [config files]               # Configuration files
```

---

## 📂 Core Application (`app/`)

### Routes (`app/routes/`)

React Router v7 uses **file-based routing**. File names map to URL paths:

#### Admin Routes (Shopify App)
- **`app.jsx`** - Main app layout with App Bridge
- **`app._index.jsx`** - Admin dashboard home page
- **`app.additional.jsx`** - Additional admin pages

#### Public Routes
- **`_index/route.jsx`** - Public landing page (if any)
- **`auth.$.jsx`** - OAuth authentication handler
- **`auth.login/route.jsx`** - Login page

#### App Proxy Routes (Customer-Facing)
- **`apps.gachi-rewards.api.generate.jsx`** 
  - **URL**: `/apps/gachi-rewards/api/generate`
  - **Purpose**: Generate referral codes for customers
  - **Used by**: Thank You page extension
  - **Security**: App Proxy signature verification

- **`apps.gachi-rewards.api.safe-link.jsx`**
  - **URL**: `/apps/gachi-rewards/api/safe-link`
  - **Purpose**: Create secure one-time discount links
  - **Security**: App Proxy signature verification

#### Webhook Routes
- **`webhooks.orders.jsx`**
  - **URL**: `/webhooks/orders/create`
  - **Purpose**: Track referrals when orders are created
  - **Trigger**: Shopify webhook on order creation

- **`webhooks.app.uninstalled.jsx`**
  - **URL**: `/webhooks/app/uninstalled`
  - **Purpose**: Clean up when app is uninstalled

- **`webhooks.app.scopes_update.jsx`**
  - **URL**: `/webhooks/app/scopes_update`
  - **Purpose**: Handle scope changes

---

### Services (`app/services/`)

Business logic separated from routes:

#### `referral.server.js`
**Core referral functionality:**
- `generateReferralCode()` - Creates unique 8-character codes
- `findOrCreateReferralCode()` - Gets or creates referral code for customer
- `createReferralJoin()` - Records successful referral purchase
- `markSafeLinkUsed()` - Marks one-time links as used
- `validateReferralCode()` - Validates code format

#### `discount.server.js`
**Shopify discount management:**
- `createShopifyDiscount()` - Creates discount codes in Shopify
- `applyDiscountToCheckout()` - Applies discount to checkout
- Handles discount code generation and validation

#### `proxy.server.js`
**App Proxy security:**
- `verifyAppProxyRequest()` - Verifies Shopify App Proxy signatures
- Ensures customer-facing APIs are secure
- Validates `shop`, `timestamp`, `signature` parameters

---

### Core Files

#### `app/db.server.js`
- Prisma client configuration
- Handles both SQLite (local) and PostgreSQL (production)
- Optional Prisma Accelerate support for production
- Singleton pattern for connection reuse

#### `app/shopify.server.js`
- Shopify authentication setup
- App Bridge configuration
- API client initialization
- Session management

---

## 🎨 Shopify Extensions (`extensions/`)

Extensions are **deployed separately** using `shopify app deploy`. They run in Shopify's environment, not your server.

### 1. Thank You Referral Extension
**Location**: `extensions/thank-you-referral/`

**Purpose**: Shows referral link on Thank You / Order Status page

**Files**:
- `src/index.jsx` - React component
- `shopify.extension.toml` - Extension configuration
- `package.json` - Dependencies

**How it works**:
1. Renders on Thank You page after purchase
2. Calls App Proxy API: `/apps/gachi-rewards/api/generate`
3. Displays referral link to customer
4. Handles guest checkouts (no customer ID)

**Extension Point**: `purchase.thank-you.block.render`

---

### 2. Checkout Discount Applier
**Location**: `extensions/checkout-discount-applier/`

**Purpose**: Applies referral discount codes during checkout

**Files**:
- `src/index.jsx` - React component
- `shopify.extension.toml` - Extension configuration
- `package.json` - Dependencies

**How it works**:
1. Detects referral code in URL (`?ref=CODE`)
2. Applies discount code automatically
3. Shows discount in checkout

**Extension Point**: `purchase.checkout.block.render`

---

### 3. Storefront Script (Theme App Extension)
**Location**: `extensions/storefront-script/`

**Purpose**: Handles referral code application on storefront

**Files**:
- `assets/applyReferral.js` - JavaScript logic
- `blocks/referral-script.liquid` - Liquid template
- `shopify.extension.toml` - Extension configuration

**How it works**:
1. Injected into theme via Liquid block
2. Detects `?ref=CODE` in URL
3. Applies discount code via Shopify's native discount system
4. Works on any page (home, product, cart, etc.)

**Extension Type**: Theme App Extension (runs in theme)

---

## 🗄️ Database (`prisma/`)

### Schema (`prisma/schema.prisma`)

**6 Main Models**:

1. **`Session`** - Shopify app authentication sessions
   - Managed by `@shopify/shopify-app-session-storage-prisma`
   - Stores OAuth tokens, shop info, user data

2. **`StorefrontUser`** - Customers who can refer others
   - Links Shopify Customer IDs to referral codes
   - One-to-one with `ReferralDiscountCode`
   - Multi-tenant (one per shop)

3. **`ReferralDiscountCode`** - Referral codes and discounts
   - Unique referral code (8 chars, e.g., "ALICE123")
   - Shopify discount code (e.g., "GACHI-ALICE123")
   - Links to referrer (StorefrontUser)

4. **`ReferralSafeLink`** - One-time secure discount links
   - Prevents coupon code scraping
   - Expires after 7 days (configurable)
   - Tracks usage

5. **`ReferralJoin`** - Successful referral purchases
   - Created when webhook detects order with referral discount
   - Links referrer to referee
   - Tracks order details, discount amount, status

6. **`ReferralConfig`** - Per-shop configuration
   - Discount percentage/amount
   - Program settings (enabled, limits, expiry)
   - One record per shop

### Migrations (`prisma/migrations/`)

- **`20251112234515_init/`** - Initial migration
  - Creates all tables
  - Sets up indexes
  - Defines relationships

---

## ⚙️ Configuration Files

### `shopify.app.toml`
**Shopify app configuration:**
- App name, client ID, URLs
- Webhook subscriptions
- App Proxy settings
- OAuth redirect URLs
- Required scopes

**Key Settings**:
```toml
application_url = "https://gachi-rewards.vercel.app"
[app_proxy]
url = "https://gachi-rewards.vercel.app/apps/gachi-rewards"
subpath = "gachi-rewards"
prefix = "apps"
```

### `vercel.json`
**Vercel deployment configuration:**
- Build command: `npm run build && npm run setup:prod`
- Output directory: `build/client`
- Region: `iad1` (US East)

### `package.json`
**Dependencies & Scripts:**
- **Build**: `npm run build` - Builds React Router app
- **Dev**: `npm run dev` - Starts Shopify CLI dev server
- **Deploy**: `shopify app deploy` - Deploys extensions
- **DB**: `npm run db:migrate` - Runs migrations
- **Setup**: `npm run setup` - Local setup (dev migrations)
- **Setup Prod**: `npm run setup:prod` - Production setup (deploy migrations)

---

## 🔄 Data Flow

### Referral Loop Flow

1. **Customer Makes Purchase**
   - Order created in Shopify
   - Webhook fires: `webhooks.orders.jsx`
   - Creates `ReferralJoin` record if referral discount used

2. **Thank You Page**
   - Extension loads: `thank-you-referral`
   - Calls API: `/apps/gachi-rewards/api/generate`
   - App Proxy verifies signature
   - Creates/finds referral code
   - Returns referral link
   - Extension displays link

3. **Referral Link Used**
   - Customer shares link: `https://store.myshopify.com/?ref=ALICE123`
   - Storefront script or checkout extension detects `?ref=`
   - Applies discount code: `GACHI-ALICE123`
   - Discount applied to checkout

4. **New Purchase with Referral**
   - Order created with referral discount
   - Webhook creates `ReferralJoin` record
   - Links referrer to referee
   - Tracks discount amount, order total

---

## 🔐 Security Architecture

### App Proxy
**Purpose**: Secure customer-facing APIs

**How it works**:
1. Shopify adds `shop`, `timestamp`, `signature` to requests
2. `proxy.server.js` verifies signature using `SHOPIFY_API_SECRET`
3. Only valid Shopify requests pass through
4. Prevents unauthorized access

**Routes using App Proxy**:
- `/apps/gachi-rewards/api/generate`
- `/apps/gachi-rewards/api/safe-link`

### Admin Authentication
**Purpose**: Secure admin routes

**How it works**:
1. Uses Shopify OAuth flow
2. `shopify.server.js` handles authentication
3. App Bridge provides secure admin context
4. Routes under `/app/*` require authentication

---

## 📦 Deployment Architecture

### Production (Vercel)
1. **Code**: Pushed to GitHub
2. **Build**: Vercel runs `npm run build && npm run setup:prod`
3. **Database**: Vercel Postgres (PostgreSQL)
4. **Migrations**: Run automatically during build
5. **Extensions**: Deployed separately via `shopify app deploy`

### Local Development
1. **Database**: SQLite (`dev.sqlite`)
2. **Server**: `npm run dev` (Shopify CLI)
3. **Tunnel**: Cloudflare tunnel for localhost
4. **Extensions**: Auto-deployed during `shopify app dev`

---

## 🎯 Key Features Implementation

### Multi-Tenant Support
- All models include `siteId` (shop domain)
- Unique constraints per shop
- Indexes optimized for shop-specific queries

### Guest Checkout Support
- Thank You extension handles missing `customer.id`
- Uses `orderId` or `customerEmail` as fallback
- Generates temporary IDs if needed

### Automatic Discount Creation
- Discounts created on-demand when referral code generated
- Uses Shopify Admin API (requires admin session)
- Falls back gracefully if admin auth unavailable

### Safe Links
- One-time use discount links
- Prevents coupon code scraping
- Expires after 7 days (configurable)
- Tracks usage per link

---

## 📚 Documentation Files

### Setup Guides
- **`QUICK-START.md`** - 5-minute quick start
- **`SETUP-LOCAL.md`** - Complete local setup
- **`SETUP-PRODUCTION.md`** - Vercel deployment guide
- **`LOCAL-DEV-SETUP.md`** - Local development database setup

### Testing Guides
- **`TEST-REFERRAL-LOOP.md`** - End-to-end testing guide
- **`TESTING-QUICK-REFERENCE.md`** - Quick testing reference
- **`TEST-STEP-BY-STEP.md`** - Step-by-step testing

### Troubleshooting
- **`FIX-DATABASE-ERRORS.md`** - Database error fixes
- **`TROUBLESHOOT-THANK-YOU-PAGE.md`** - Thank You page issues
- **`DEBUG-REFERRAL-NOT-SHOWING.md`** - Referral link debugging

### Deployment
- **`VERCEL-DEPLOYMENT-CHECKLIST.md`** - Deployment checklist
- **`DEPLOYMENT-READINESS.md`** - Deployment status
- **`DEPLOYMENT-ISSUES-FIXED.md`** - Issues fixed summary

---

## 🚀 Quick Commands Reference

```bash
# Local Development
npm run dev                    # Start dev server
npm run db:migrate            # Run migrations
npm run db:studio             # Open Prisma Studio

# Production
npm run build                # Build for production
npm run setup:prod           # Production setup (migrations)
shopify app deploy            # Deploy extensions

# Database
npm run db:generate          # Generate Prisma client
prisma studio                # Database viewer
```

---

## 🔗 Key URLs & Endpoints

### Admin Routes
- `/app` - Admin dashboard
- `/auth` - OAuth authentication

### App Proxy Routes (Customer-Facing)
- `/apps/gachi-rewards/api/generate` - Generate referral code
- `/apps/gachi-rewards/api/safe-link` - Create safe link

### Webhooks
- `/webhooks/orders/create` - Order created webhook
- `/webhooks/app/uninstalled` - App uninstalled webhook
- `/webhooks/app/scopes_update` - Scopes updated webhook

---

## 📝 Environment Variables

**Required**:
- `SHOPIFY_API_KEY` - Shopify app API key
- `SHOPIFY_API_SECRET` - Shopify app secret
- `SHOPIFY_APP_URL` - App URL (production or localhost)
- `SCOPES` - Required Shopify scopes
- `DATABASE_URL` - Database connection string
- `NODE_ENV` - `production` or `development`

**Optional**:
- `WEBHOOK_SECRET` - Webhook signing secret

---

## 🎨 Extension Points

### Checkout Extensions
- **Thank You**: `purchase.thank-you.block.render`
- **Checkout**: `purchase.checkout.block.render`

### Theme Extensions
- **Storefront Script**: Liquid block in theme

---

## ✅ Summary

**Gachi Rewards** is a well-structured Shopify app with:

1. **Clear separation**: Routes, services, extensions
2. **Security**: App Proxy for customer-facing APIs
3. **Multi-tenant**: One database, multiple shops
4. **Extensible**: Easy to add features
5. **Documented**: Comprehensive guides for setup, testing, deployment

The architecture follows Shopify best practices and React Router v7 conventions, making it maintainable and scalable.

---

**For specific implementation details, see the individual files or refer to the documentation guides.**

