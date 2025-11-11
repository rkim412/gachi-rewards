# Deploy Gachi Rewards to Vercel

## Prerequisites

✅ Code committed to Git  
✅ GitHub repository created  
✅ Ready to deploy!

## Step 1: Push to GitHub

If you haven't pushed yet:

```bash
# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/gachi-rewards.git

# Push to GitHub
git push -u origin main
```

## Step 2: Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Create/select your project
3. Go to **Storage** tab
4. Click **"Create Database"** → **"Postgres"**
5. Choose **Hobby** (free) plan
6. Select region
7. Click **"Create"**

## Step 3: Get Database Connection String

1. In Storage tab, click your Postgres database
2. Go to **Settings** tab
3. Copy **`POSTGRES_PRISMA_URL`** connection string

## Step 4: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select **GitHub** (or GitLab/Bitbucket)
4. Authorize Vercel if needed
5. Select **`gachi-rewards`** repository
6. Click **"Import"**

## Step 5: Configure Vercel Project

### Build Settings (Auto-detected)
- **Framework Preset**: React Router (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### Environment Variables

Add these in Vercel dashboard:

1. **DATABASE_URL**
   - Value: Paste your `POSTGRES_PRISMA_URL` from Step 3
   - Environments: Production, Preview, Development

2. **SHOPIFY_API_KEY**
   - Value: Your Shopify API key
   - Environments: All

3. **SHOPIFY_API_SECRET**
   - Value: Your Shopify API secret
   - Environments: All

4. **SHOPIFY_APP_URL**
   - Value: `https://your-project.vercel.app` (Vercel will provide this)
   - Environments: All

5. **SCOPES**
   - Value: `write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy`
   - Environments: All

6. **WEBHOOK_SECRET**
   - Value: Your webhook secret from Shopify Partners
   - Environments: All

7. **NODE_ENV**
   - Value: `production`
   - Environments: Production

## Step 6: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Vercel will provide your app URL: `https://your-project.vercel.app`

## Step 7: Run Database Migrations

After first deployment:

```bash
# Option 1: Via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option 2: Add to package.json setup script (already done!)
# Vercel runs `npm run setup` automatically
```

## Step 8: Update Shopify App Configuration

1. Update `shopify.app.toml`:
   ```toml
   application_url = "https://your-project.vercel.app"
   ```

2. Update App Proxy URL:
   ```toml
   [app_proxy]
   url = "https://your-project.vercel.app/apps/gachi-rewards"
   ```

3. Deploy Shopify app:
   ```bash
   shopify app deploy
   ```

## Step 9: Configure App Proxy in Shopify

1. Go to Shopify Partners Dashboard
2. Select your app
3. Go to **App setup** → **App proxy**
4. Set:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://your-project.vercel.app/apps/gachi-rewards`
5. Save

## Step 10: Deploy Extensions

```bash
# Deploy all extensions
shopify app deploy

# Or deploy individually
cd extensions/thank-you-referral
shopify app generate extension
```

## Verify Deployment

1. **Check Vercel deployment**: https://vercel.com/dashboard
2. **Check database**: Run `npx prisma studio` locally with production DATABASE_URL
3. **Test App Proxy**: Visit `https://your-store.myshopify.com/apps/gachi-rewards/api/safe-link?referralCode=TEST&shop=your-store.myshopify.com`
4. **Test webhook**: Create a test order in Shopify

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `POSTGRES_PRISMA_URL` is used (not `POSTGRES_URL`)
- Check database is not paused
- Verify connection string format

### App Proxy Not Working
- Check App Proxy is configured in Shopify Partners
- Verify URL matches in `shopify.app.toml`
- Check HMAC signature verification

## Next Steps

1. ✅ Code on GitHub
2. ✅ Deployed to Vercel
3. ✅ Database connected
4. ✅ Environment variables set
5. ⏭️ Test referral flow
6. ⏭️ Deploy to Shopify App Store

---

## Quick Reference

| Service | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **GitHub Repository** | https://github.com/YOUR_USERNAME/gachi-rewards |
| **Shopify Partners** | https://partners.shopify.com |
| **App URL** | https://your-project.vercel.app |

