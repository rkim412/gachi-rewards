# 🧙‍♂️ Gachi Rewards - Project Overview

## What is Gachi Rewards?

**Gachi Rewards** is a full-stack Shopify referral engine app that enables **viral growth** through automatic referral link generation. Every customer who makes a purchase immediately gets their own referral link to share, creating a frictionless viral loop.

---

## 🎯 Core Concept

### The Viral Loop:
```
1. Alice buys product → Gets referral link: store.com/?ref=ALICE123
2. Alice shares link → Bob clicks and gets 10% off
3. Bob buys → Referral tracked → Bob gets his own link
4. Bob shares → Carol gets discount → Carol buys → Gets link...
5. Infinite viral growth! 🚀
```

---

## 🏗️ Architecture

### System Flow:
```
Storefront (store.com/?ref=CODE)
    ↓
Storefront Script (detects referral)
    ↓
App Proxy (/apps/gachi-rewards/api/safe-link) ← Secure, no API keys!
    ↓
Vercel Backend (React Router)
    ↓
PostgreSQL Database (Vercel Postgres)
```

### Key Components:

1. **Storefront Script** - Detects `?ref=CODE` parameter
2. **App Proxy** - Secure API routing (no exposed keys)
3. **Checkout Extension** - Auto-applies discount
4. **Thank You Extension** - Shows referral link
5. **Webhook Handler** - Tracks conversions
6. **PostgreSQL Database** - Stores all referral data

---

## 📦 Technology Stack

### Backend:
- **React Router** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Production database (Vercel Postgres)
- **Shopify Admin API** - Discount creation, order tracking

### Frontend:
- **React** - UI components
- **Shopify UI Extensions** - Checkout/Thank You blocks
- **Polaris Web Components** - Shopify design system

### Infrastructure:
- **Vercel** - Hosting & deployment
- **Vercel Postgres** - Managed database
- **Shopify App Proxy** - Secure API routing

---

## 🗄️ Database Schema

### Core Models:

1. **StorefrontUser**
   - Links Shopify customers to referral codes
   - One referral code per customer

2. **ReferralDiscountCode**
   - Unique referral code (e.g., "ALICE123")
   - Shopify discount code (e.g., "GACHI-ALICE123")
   - Links to Shopify discount

3. **ReferralSafeLink**
   - One-time use tokens for security
   - Expires after 7 days
   - Prevents coupon scraping

4. **ReferralJoin**
   - Tracks successful referrals
   - Links referrer → referee
   - Stores order details & commission

5. **ReferralConfig**
   - Per-shop configuration
   - Discount percentage, expiry, limits

### Key Features:
- ✅ **Direct referrer tracking** - Easy queries (who referred whom)
- ✅ **Multi-tenant** - One database, multiple shops
- ✅ **Optimized indexes** - Fast queries for analytics

---

## 🔐 Security Features

### 1. App Proxy
- All customer-facing APIs route through Shopify
- HMAC signature verification
- No API keys exposed in client code

### 2. Safe Links
- One-time use tokens
- 7-day expiry
- Prevents coupon code scraping

### 3. Self-Referral Prevention
- Blocks customers from referring themselves
- Email validation

### 4. Multi-Tenant Isolation
- Shop-specific data isolation
- Unique constraints per shop

---

## 📁 Project Structure

```
gachi-rewards/
├── app/
│   ├── services/
│   │   ├── proxy.server.js          # App Proxy verification
│   │   ├── referral.server.js       # Referral business logic
│   │   └── discount.server.js       # Shopify discount creation
│   │
│   └── routes/
│       ├── apps.gachi-rewards.api.safe-link.jsx    # Create safe links
│       ├── apps.gachi-rewards.api.generate.jsx     # Generate referral codes
│       └── webhooks.orders.jsx                      # Track conversions
│
├── extensions/
│   ├── thank-you-referral/          # Thank You page block
│   ├── checkout-discount-applier/   # Auto-apply discount
│   └── storefront-script/           # Detect referral links
│
├── prisma/
│   └── schema.prisma                # Database schema (PostgreSQL)
│
└── shopify.app.toml                 # App configuration
```

---

## 🔄 User Flows

### Flow 1: Customer Gets Referral Link
```
1. Alice completes purchase
2. Thank You page loads
3. Extension calls: /apps/gachi-rewards/api/generate
4. Backend creates referral code & discount
5. Alice sees: store.com/?ref=ALICE123
6. Alice copies and shares
```

### Flow 2: Friend Uses Referral
```
1. Bob clicks: store.com/?ref=ALICE123
2. Storefront script detects ?ref
3. Calls App Proxy: /apps/gachi-rewards/api/safe-link
4. Creates one-time safe link
5. Stores in cart attributes
6. Checkout extension auto-applies discount
7. Bob completes purchase
8. Webhook fires → Referral tracked
9. Bob gets his own referral link (viral loop!)
```

---

## 🚀 API Endpoints

### Customer-Facing (App Proxy):

1. **GET/POST `/apps/gachi-rewards/api/safe-link`**
   - Creates one-time discount link
   - Called by storefront script
   - Returns: `{ oneTimeCode, discountCode, expiresAt }`

2. **GET/POST `/apps/gachi-rewards/api/generate`**
   - Generates referral code for customer
   - Called by Thank You extension
   - Returns: `{ referralCode, referralLink, discountCode }`

### Webhooks:

1. **POST `/webhooks/orders/create`**
   - Tracks referral conversions
   - Creates ReferralJoin records
   - Marks safe links as used

---

## ⚙️ Configuration

### Required Shopify Scopes:
- `read_customers, write_customers` - Customer management
- `read_orders` - Order tracking
- `write_discounts, read_discounts` - Discount creation
- `write_app_proxy` - App Proxy routing

### Environment Variables:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://... (Vercel Postgres)
WEBHOOK_SECRET=your_webhook_secret
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
```

---

## 🎨 Extensions

### 1. Thank You Referral Extension
- **Location**: Thank You page
- **Purpose**: Display referral link after purchase
- **Features**: Copy-to-clipboard, referral link display

### 2. Checkout Discount Applier
- **Location**: Checkout discount step
- **Purpose**: Auto-apply discount from cart attributes
- **Features**: Seamless discount application

### 3. Storefront Script
- **Location**: Storefront (theme)
- **Purpose**: Detect referral links (`?ref=CODE`)
- **Features**: Creates safe links, stores in cart

---

## 📊 Database Features

### Direct Referrer Tracking:
- Easy queries: "Who referred Bob?"
- Direct relationship: `ReferralJoin.referrer` → `StorefrontUser`
- Analytics-ready: Referral trees, conversion rates

### Multi-Tenant Support:
- One database, multiple Shopify stores
- Shop isolation via `siteId`
- Per-shop configuration

### Performance:
- Optimized indexes for common queries
- Efficient lookups by referral code, order ID, email
- Supports analytics and reporting

---

## 🔒 Security Highlights

1. **App Proxy** - No API keys in client code
2. **Safe Links** - One-time, expiring tokens
3. **HMAC Verification** - All App Proxy requests verified
4. **Self-Referral Prevention** - Email validation
5. **Shop Isolation** - Multi-tenant security

---

## 📈 Current Status

### ✅ Completed:
- Database schema with all models
- Service layer (referral, discount, proxy)
- API routes (App Proxy endpoints)
- Webhook handler
- All three extensions
- App Proxy configuration
- PostgreSQL setup
- Git repository initialized

### ⏭️ Next Steps:
1. Push to GitHub (in progress)
2. Set up Vercel Postgres database
3. Configure environment variables
4. Deploy to Vercel
5. Deploy Shopify extensions
6. Test end-to-end referral flow

---

## 🎯 Unique Features

1. **Zero-Friction Viral Loop** - Customers get links immediately
2. **Secure by Design** - App Proxy + Safe Links
3. **Production-Ready** - PostgreSQL, multi-tenant, scalable
4. **Shopify Best Practices** - Uses official patterns

---

## 📚 Documentation

- `README.md` - Main project documentation
- `VERCEL-POSTGRES-SETUP.md` - Database setup guide
- `PROJECT-OVERVIEW.md` - This file

---

## 🚀 Deployment

### To Vercel:
1. Push to GitHub ✅
2. Import to Vercel
3. Create Vercel Postgres database
4. Add environment variables
5. Deploy!

### To Shopify:
1. Deploy app to Vercel
2. Update `shopify.app.toml` with app URL
3. Run `shopify app deploy`
4. Configure App Proxy in Partners Dashboard

---

## 💡 Use Cases

- E-commerce stores wanting referral programs
- Brands focused on customer acquisition
- Merchants looking for viral growth
- Apps needing secure customer-facing APIs

---

**Gachi Rewards** - Turn every customer into a brand ambassador! 🎉

