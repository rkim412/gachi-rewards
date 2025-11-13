# Vercel Deployment Checklist

Complete checklist to ensure successful deployment to Vercel.

---

## ✅ Pre-Deployment: Code Ready

- [x] **Prisma Schema**: Updated to PostgreSQL with `env("DATABASE_URL")`
- [x] **Vercel Config**: `vercel.json` configured with build commands
- [x] **Build Scripts**: `setup:prod` uses `prisma migrate deploy`
- [x] **Git Ignore**: `.gitignore` excludes unnecessary files
- [x] **Code Committed**: All changes committed to git

---

## 📋 Step 1: Push to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Configure for Vercel deployment with PostgreSQL"

# Push to GitHub
git push origin main
```

**Verify**: Code is on GitHub and repository is accessible.

---

## 📋 Step 2: Create Vercel Project

1. Go to: https://vercel.com/new
2. Click: "Import Git Repository"
3. Select: Your GitHub repository
4. Click: "Import"

**Don't deploy yet** - we need to configure first!

---

## 📋 Step 3: Create Vercel Postgres Database

1. In Vercel Dashboard → Your Project → **Storage** tab
2. Click: **"Create Database"**
3. Select: **"Postgres"**
4. Name: `gachi-rewards-db` (or any name)
5. Region: Choose closest to your users
6. Click: **"Create"**

**After creation:**
1. Click on your database
2. Go to **"Settings"** tab
3. Find **"Connection String"** section
4. Copy **`POSTGRES_PRISMA_URL`** (NOT `POSTGRES_URL`)
   - Format: `postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15`

---

## 📋 Step 4: Add Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these **one by one**:

### 1. SHOPIFY_API_KEY
- **Key**: `SHOPIFY_API_KEY`
- **Value**: From Partners Dashboard → Your App → App setup → API credentials → API key
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 2. SHOPIFY_API_SECRET
- **Key**: `SHOPIFY_API_SECRET`
- **Value**: From Partners Dashboard → Your App → App setup → API credentials → Reveal API secret
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- **⚠️ Keep secret!**

### 3. SHOPIFY_APP_URL
- **Key**: `SHOPIFY_APP_URL`
- **Value**: Your Vercel URL (e.g., `https://gachi-rewards.vercel.app`)
- **Note**: Update after first deployment with actual URL
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 4. SCOPES
- **Key**: `SCOPES`
- **Value**: `write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 5. DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Paste the **`POSTGRES_PRISMA_URL`** you copied in Step 3
- **⚠️ Important**: Must use `POSTGRES_PRISMA_URL`, not `POSTGRES_URL`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 6. NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environments**: ✅ Production only

### 7. WEBHOOK_SECRET (Optional but Recommended)
- **Key**: `WEBHOOK_SECRET`
- **Value**: From Partners Dashboard → Your App → App setup → Webhooks → Webhook signing secret
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 📋 Step 5: Configure Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset**: Leave as "Other" or blank (auto-detect)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build && npm run setup:prod` (from vercel.json)
- **Output Directory**: `build/client` (from vercel.json)
- **Install Command**: `npm install` (from vercel.json)

---

## 📋 Step 6: Deploy!

1. Click: **"Deploy"** button
2. Wait: First deployment takes 2-5 minutes
3. Watch: Build logs for any errors

**Build process:**
1. Installs dependencies (`npm install`)
2. Builds React Router app (`npm run build`)
3. Generates Prisma client (`prisma generate`)
4. Runs database migrations (`prisma migrate deploy`)
5. Deploys to Vercel

---

## 📋 Step 7: Verify Deployment

### Check Build Logs

1. Go to: Vercel Dashboard → Your Project → **Deployments**
2. Click: Latest deployment
3. Check: **"Build Logs"** tab
4. Verify: No errors, migrations completed

### Check Database

1. Go to: Vercel Dashboard → Your Project → **Storage** → Your Database
2. Click: **"Data"** tab
3. Verify: Tables exist:
   - `Session`
   - `StorefrontUser`
   - `ReferralDiscountCode`
   - `ReferralSafeLink`
   - `ReferralJoin`
   - `ReferralConfig`

### Test App URL

1. Copy: Your Vercel URL (e.g., `https://gachi-rewards.vercel.app`)
2. Visit: The URL in browser
3. Verify: App loads (may show login/error, that's okay)

---

## 📋 Step 8: Update Environment Variables

After you have your **actual Vercel URL**:

1. Go to: Vercel → Your Project → **Settings** → **Environment Variables**
2. Find: `SHOPIFY_APP_URL`
3. Click: **"Edit"**
4. Update: To your actual Vercel URL
5. Click: **"Save"**
6. **Redeploy**: Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

---

## 📋 Step 9: Update Shopify Partners Dashboard

1. Go to: https://partners.shopify.com
2. Select: Your App → **"App setup"**
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

4. Click: **"Save"** on each section

---

## 📋 Step 10: Deploy Shopify Extensions

Extensions are deployed separately from Vercel:

```bash
# Make sure you're in project directory
cd /path/to/gachi-rewards

# Deploy all extensions
shopify app deploy
```

This deploys:
- **Thank You Referral Extension**
- **Checkout Discount Applier**
- **Storefront Script**

---

## 📋 Step 11: Test Production

### Test App Proxy

Visit in browser:
```
https://your-store.myshopify.com/apps/gachi-rewards/api/generate?orderId=test&customerEmail=test@example.com
```

**Expected**: JSON response with `success: true`

### Test Full Flow

1. Make a test purchase
2. Check Thank You page for referral link
3. Use referral link in new browser
4. Verify discount applies
5. Complete purchase
6. Check database for `ReferralJoin` record

---

## 🐛 Troubleshooting

### Build Fails: "Prisma schema error"

**Fix**: Verify `prisma/schema.prisma` uses:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Build Fails: "Migration not found"

**Fix**: Verify `prisma/migrations/` directory exists and has migration files.

### Build Fails: "DATABASE_URL not set"

**Fix**: Add `DATABASE_URL` environment variable in Vercel with `POSTGRES_PRISMA_URL` value.

### Migration Fails: "Connection refused"

**Fix**: 
- Verify `DATABASE_URL` uses `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- Check database is created and accessible
- Verify connection string format

### App Returns 401: "Invalid request signature"

**Fix**:
- Verify `SHOPIFY_API_SECRET` in Vercel matches Partners Dashboard exactly
- Check App Proxy URL in Partners Dashboard matches Vercel URL
- Verify App Proxy is enabled

---

## ✅ Success Criteria

Deployment is successful when:

- [x] Build completes without errors
- [x] Database migrations ran successfully
- [x] All tables exist in database
- [x] App URL is accessible
- [x] App Proxy endpoint returns JSON (not 401/404)
- [x] Shopify Partners Dashboard URLs updated
- [x] Extensions deployed
- [x] Test purchase works end-to-end

---

## 📝 Quick Reference

### Vercel Project
- **Dashboard**: https://vercel.com/dashboard
- **Project URL**: `https://your-project.vercel.app`

### Shopify App
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

**You're ready to deploy! Follow these steps in order.** 🚀

