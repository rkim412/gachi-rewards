# Production Setup Guide - Vercel + PostgreSQL

Complete guide to deploy Gachi Rewards to Vercel with PostgreSQL for production.

## Prerequisites

- **GitHub Account** (repository pushed to GitHub)
- **Vercel Account** (free at https://vercel.com)
- **Shopify Partner Account** (https://partners.shopify.com)
- **Production Shopify Store** (or development store for testing)

---

## Step 1: Prepare Your Repository

### Ensure Code is Ready

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Verify Key Files Exist

- ✅ `package.json` - Dependencies and scripts
- ✅ `prisma/schema.prisma` - Database schema (PostgreSQL)
- ✅ `vercel.json` - Vercel configuration
- ✅ `shopify.app.toml` - Shopify app configuration

---

## Step 2: Create Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to**: https://vercel.com/new
2. **Click**: "Import Git Repository"
3. **Select**: GitHub (authorize if needed)
4. **Find**: Your repository (`rkim412/gachi-rewards` or your repo)
5. **Click**: "Import"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

---

## Step 3: Configure Build Settings

Vercel should auto-detect React Router, but verify:

- **Framework Preset**: Leave as "Other" or blank (auto-detect)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build && npm run setup` (already in vercel.json)
- **Output Directory**: `build/client`
- **Install Command**: `npm install`

**⚠️ DON'T CLICK DEPLOY YET** - We need to add environment variables first!

---

## Step 4: Create Vercel Postgres Database

1. In Vercel Dashboard → Your Project → **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a name: `gachi-rewards-db` (or any name)
5. Select a region (closest to your users)
6. Click **"Create"**

**After database is created:**

1. Click on your database
2. Go to **"Settings"** tab
3. Find **"Connection String"** section
4. Copy **`POSTGRES_PRISMA_URL`** (NOT `POSTGRES_URL`)
   - This includes connection pooling which Prisma needs
   - Format: `postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15`

---

## Step 5: Add Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these variables one by one:

### 1. SHOPIFY_API_KEY
- **Key**: `SHOPIFY_API_KEY`
- **Value**: Get from https://partners.shopify.com → Your app → **App setup** → **API credentials** → Copy **"API key"**
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 2. SHOPIFY_API_SECRET
- **Key**: `SHOPIFY_API_SECRET`
- **Value**: Same location → Click **"Reveal"** next to **"API secret key"** → Copy
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- **⚠️ Keep this secret!**

### 3. SHOPIFY_APP_URL
- **Key**: `SHOPIFY_APP_URL`
- **Value**: Your Vercel URL (e.g., `https://gachi-rewards.vercel.app`)
- **Note**: You'll update this after first deployment with actual URL
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 4. SCOPES
- **Key**: `SCOPES`
- **Value**: Copy exactly (no spaces after commas):
  ```
  write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
  ```
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 5. DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Paste the **`POSTGRES_PRISMA_URL`** you copied from Step 4
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- **⚠️ Important**: Must use `POSTGRES_PRISMA_URL`, not `POSTGRES_URL`

### 6. NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environments**: ✅ Production only

### 7. WEBHOOK_SECRET (Optional but Recommended)
- **Key**: `WEBHOOK_SECRET`
- **Value**: Get from https://partners.shopify.com → Your app → **App setup** → **Webhooks** → Copy **"Webhook signing secret"**
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## Step 6: Deploy!

1. **Click**: "Deploy" button in Vercel
2. **Wait**: First deployment takes 2-5 minutes
3. **Watch**: Build logs for any errors

The build process will:
- Install dependencies
- Build React Router app
- Generate Prisma client
- Run database migrations automatically (via `npm run setup`)

---

## Step 7: Verify Deployment

After deployment succeeds:

1. **Copy your Vercel URL**: `https://your-project.vercel.app`
2. **Check**: The app should be accessible
3. **Note**: First request might be slow (cold start)

### Test Database Connection

The migrations should have run automatically. Verify:

1. Go to Vercel Dashboard → Your Project → **Storage** → Your Database
2. Click **"Data"** tab
3. You should see tables:
   - `Session`
   - `StorefrontUser`
   - `ReferralDiscountCode`
   - `ReferralSafeLink`
   - `ReferralJoin`
   - `ReferralConfig`

---

## Step 8: Update SHOPIFY_APP_URL

After you have your actual Vercel URL:

1. Go to Vercel → Your project → **Settings** → **Environment Variables**
2. Find `SHOPIFY_APP_URL`
3. Click **"Edit"**
4. Update to your actual URL (e.g., `https://gachi-rewards-xyz.vercel.app`)
5. Click **"Save"**
6. **Redeploy**: Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

---

## Step 9: Update Shopify Configuration

### In Shopify Partners Dashboard:

1. Go to https://partners.shopify.com
2. Select your app → **"App setup"**
3. Update these fields:

   **App URL:**
   ```
   https://your-actual-vercel-url.vercel.app
   ```

   **Allowed redirection URL(s):**
   ```
   https://your-actual-vercel-url.vercel.app/auth
   ```

   **App Proxy:**
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://your-actual-vercel-url.vercel.app/apps/gachi-rewards`

### In GitHub (Update shopify.app.toml):

Update `shopify.app.toml` with your actual Vercel URL:

1. **Line 5**: `application_url = "https://your-actual-url.vercel.app"`
2. **Line 45**: `url = "https://your-actual-url.vercel.app/apps/gachi-rewards"`
3. **Line 50**: `redirect_urls = [ "https://your-actual-url.vercel.app/auth" ]`

Then commit and push:

```bash
git add shopify.app.toml
git commit -m "Update shopify.app.toml with production Vercel URL"
git push origin main
```

Vercel will automatically redeploy.

---

## Step 10: Run Database Migrations (If Needed)

Migrations should run automatically during build, but if needed:

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link to your project (in your project directory)
cd /path/to/gachi-rewards
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### Option B: Via Vercel Dashboard

1. Go to your deployment
2. Click **"Functions"** tab
3. Open a terminal/shell
4. Run: `npx prisma migrate deploy`

---

## Step 11: Deploy Shopify Extensions

```bash
# Make sure you're in the project directory
cd /path/to/gachi-rewards

# Deploy all extensions
shopify app deploy
```

This deploys:
- **Thank You Referral Extension** - Shows referral link after purchase
- **Checkout Discount Applier** - Applies discount in checkout
- **Storefront Script** - Handles referral link clicks

---

## Step 12: Test Production Deployment

### Test in Production Store

1. **Install App**:
   - Go to your production store admin
   - Navigate to Apps
   - Install your app

2. **Test Referral Flow**:
   - Make a test purchase
   - Check Thank You page for referral link
   - Copy referral link
   - Open in incognito/private window
   - Add product to cart
   - Verify discount is applied
   - Complete purchase
   - Check Vercel database for `ReferralJoin` record

### Verify Database

1. Go to Vercel Dashboard → Your Project → **Storage** → Your Database
2. Click **"Data"** tab
3. Browse tables to verify records are being created

---

## Step 13: Monitor & Maintain

### Monitor Logs

- **Vercel Dashboard** → Your Project → **Logs** tab
- Check for errors, warnings, or performance issues

### Monitor Database

- **Vercel Dashboard** → Your Project → **Storage** → Your Database
- Monitor usage, connections, and performance

### Set Up Alerts (Optional)

- Configure Vercel alerts for deployment failures
- Monitor database connection limits
- Set up error tracking (e.g., Sentry)

---

## Troubleshooting

### Build Fails

**Check:**
- Build logs in Vercel dashboard
- Node.js version (should be 20.19+ or 22.12+)
- All environment variables are set

**Fix:**
- Check error message in build logs
- Verify environment variables are correct
- Ensure `package.json` has all dependencies

### Database Connection Fails

**Check:**
- `DATABASE_URL` uses `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- Database is running in Vercel Storage
- Migrations have been run

**Fix:**
- Verify `DATABASE_URL` in environment variables
- Run migrations manually if needed: `npx prisma migrate deploy`
- Check database is accessible

### App Proxy Returns 401

**Check:**
- `SHOPIFY_API_SECRET` is correct
- App Proxy configured in Shopify Partners
- HMAC signature verification

**Fix:**
- Verify `SHOPIFY_API_SECRET` in Vercel
- Check App Proxy settings in Shopify Partners
- Verify proxy URL matches your Vercel URL

### Webhooks Not Working

**Check:**
- `WEBHOOK_SECRET` matches Shopify (if using)
- Webhook URL in Shopify Partners
- Webhook handler code

**Fix:**
- Verify `WEBHOOK_SECRET` in Vercel
- Check webhook URL: `https://your-project.vercel.app/webhooks/orders/create`
- Test webhook via Shopify CLI

### Migrations Fail

**Check:**
- `DATABASE_URL` is correct
- Database is accessible
- Prisma schema is valid

**Fix:**
- Run migrations manually: `npx prisma migrate deploy`
- Check `DATABASE_URL` uses `POSTGRES_PRISMA_URL`
- Verify database is accessible

---

## Production Checklist

- [ ] Project imported to Vercel
- [ ] Vercel Postgres database created
- [ ] All environment variables added (7 variables)
- [ ] `DATABASE_URL` set to `POSTGRES_PRISMA_URL`
- [ ] First deployment successful
- [ ] Database migrations completed
- [ ] `SHOPIFY_APP_URL` updated with actual Vercel URL
- [ ] Shopify Partners Dashboard updated
- [ ] `shopify.app.toml` updated and pushed
- [ ] Extensions deployed
- [ ] App tested in production store
- [ ] Database records verified
- [ ] Webhooks working
- [ ] App Proxy working

---

## Quick Reference

### Your Vercel Project
- **Dashboard**: https://vercel.com/dashboard
- **Project URL**: `https://your-project.vercel.app` (after deploy)

### Your Shopify App
- **Partners Dashboard**: https://partners.shopify.com
- **App Setup**: Partners → Your App → App setup

### Environment Variables Summary
```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-project.vercel.app
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL=postgres://... (from POSTGRES_PRISMA_URL)
NODE_ENV=production
WEBHOOK_SECRET=your_webhook_secret (optional)
```

---

## Next Steps

1. **Monitor**: Check Vercel logs for any errors
2. **Test**: Test all features in production store
3. **Optimize**: Monitor database usage and performance
4. **Scale**: Add more shops as needed
5. **Backup**: Set up database backups (Vercel handles this automatically)

---

**Your production environment is ready! 🚀**

