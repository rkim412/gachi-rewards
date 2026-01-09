# Vercel Setup Checklist - Complete Guide

After removing ngrok, you'll need to set up Vercel and update all URLs. Follow this checklist in order.

---

## 📋 Pre-Deployment Checklist

### 1. Deploy to Vercel First

**You need your Vercel URL before updating anything else!**

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Remove ngrok, prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure build settings (should auto-detect)
   - **Don't deploy yet** - we need environment variables first!

---

## 🔧 Step 1: Create Vercel Postgres Database

1. In Vercel Dashboard → Your Project → **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Name it: `gachi-rewards-db` (or any name)
5. Select region (closest to your users)
6. Click **"Create"**

**After creation:**
- Copy **`POSTGRES_PRISMA_URL`** from Connection String section
- Save this for `DIRECT_DATABASE_URL` environment variable

---

## 🔑 Step 2: Set Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **one by one** (check ✅ Production, ✅ Preview, ✅ Development for all):

### Required Variables:

1. **SHOPIFY_API_KEY**
   - Get from: https://partners.shopify.com → Your app → **App setup** → **Client credentials**
   - Value: Your API key (starts with something like `f232a783...`)

2. **SHOPIFY_API_SECRET**
   - Get from: Same location as above
   - Value: Your API secret (long string)

3. **SHOPIFY_APP_URL**
   - Value: `https://YOUR-PROJECT-NAME.vercel.app`
   - ⚠️ **Replace `YOUR-PROJECT-NAME` with your actual Vercel project name**
   - You'll get this after first deployment, then update this variable

4. **SCOPES**
   - Value: `read_customers,read_discounts,read_orders,write_app_proxy,write_customers,write_discounts,write_products`

5. **DATABASE_URL**
   - Get from: Vercel Dashboard → Storage → Your Database → **Connection String**
   - Use: **`POSTGRES_PRISMA_URL`** (NOT `POSTGRES_URL`)
   - Format: `prisma://...` (if using Prisma Accelerate) OR `postgres://...`

6. **DIRECT_DATABASE_URL**
   - Get from: Same location as above
   - Use: **`POSTGRES_PRISMA_URL`** (the raw postgres:// connection string)
   - Format: `postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15`

7. **NODE_ENV**
   - Value: `production`
   - Environments: ✅ **Production only** (not Preview or Development)

8. **WEBHOOK_SECRET** (Optional but Recommended)
   - Get from: https://partners.shopify.com → Your app → **App setup** → **Webhooks** → **"Webhook signing secret"**
   - Copy the secret value

---

## 🚀 Step 3: Deploy to Vercel

1. **Click "Deploy"** in Vercel Dashboard
2. **Wait for deployment** (2-5 minutes for first deploy)
3. **Copy your Vercel URL** from the deployment page
   - Format: `https://your-project-name.vercel.app`
   - Or: `https://gachi-rewards.vercel.app` (if you named it that)

---

## 🔄 Step 4: Update SHOPIFY_APP_URL in Vercel

After you have your **actual Vercel URL**:

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Find `SHOPIFY_APP_URL`
3. Click **"Edit"**
4. Update to your actual Vercel URL: `https://your-actual-project.vercel.app`
5. Click **"Save"**
6. **Redeploy:** Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

---

## 📝 Step 5: Update shopify.app.toml

Update `shopify.app.toml` with your actual Vercel URL:

```toml
application_url = "https://your-actual-project.vercel.app"

[auth]
redirect_urls = [ "https://your-actual-project.vercel.app/auth" ]

[app_proxy]
url = "https://your-actual-project.vercel.app/apps/gachi-rewards"
```

**Replace `your-actual-project` with your actual Vercel project name!**

Then commit and push:
```bash
git add shopify.app.toml
git commit -m "Update shopify.app.toml with Vercel URL"
git push origin main
```

Vercel will automatically redeploy.

---

## 🌐 Step 6: Update Shopify Partners Dashboard

Go to: https://partners.shopify.com → Your app → **App setup** tab

### A. App URL
1. Scroll to **"App URL"** section
2. Set to: `https://your-actual-project.vercel.app/`
3. Click **"Save"**

### B. Allowed Redirection URL(s)
1. Scroll to **"Allowed redirection URL(s)"**
2. Add: `https://your-actual-project.vercel.app/auth`
3. Click **"Save"**

### C. App Proxy URL
1. Scroll to **"App Proxy"** section
2. Click **"Configure"** or **"Edit"**
3. Set:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://your-actual-project.vercel.app/apps/gachi-rewards`
4. Click **"Save"**

### D. Webhook URLs (if configured manually)
If you have webhooks configured manually in Partners Dashboard, update them:

- **orders/create**: `https://your-actual-project.vercel.app/webhooks/orders/create`
- **app/uninstalled**: `https://your-actual-project.vercel.app/webhooks/app/uninstalled`
- **app/scopes_update**: `https://your-actual-project.vercel.app/webhooks/app/scopes_update`
- **compliance**: `https://your-actual-project.vercel.app/webhooks/compliance`

**Note:** If webhooks are managed via `shopify.app.toml`, they should update automatically.

---

## ✅ Step 7: Verify Everything Works

### Test 1: App Loads
1. Go to your Shopify store admin
2. Click on your app
3. Should load from Vercel URL

### Test 2: Database Connection
1. Go to: **Vercel Dashboard → Your Project → Storage → Your Database → Data**
2. Should see tables created (after migrations run)

### Test 3: Webhooks
1. Create a test order in your store
2. Check Vercel logs: **Vercel Dashboard → Your Project → Logs**
3. Should see webhook received

### Test 4: App Proxy
1. Visit: `https://your-store.myshopify.com/apps/gachi-rewards/api/generate`
2. Should work (may need authentication)

---

## 🔍 Troubleshooting

### "Build Failed"
- Check Vercel build logs
- Verify all environment variables are set
- Check `DATABASE_URL` is correct

### "Database Connection Error"
- Verify `DATABASE_URL` and `DIRECT_DATABASE_URL` are set
- Check database exists in Vercel Storage
- Verify connection string format

### "App Not Loading"
- Verify App URL in Partners Dashboard matches Vercel URL
- Check Vercel deployment is successful
- Verify `SHOPIFY_APP_URL` in Vercel matches actual URL

### "Webhooks Not Working"
- Verify webhook URLs in Partners Dashboard match Vercel URL
- Check Vercel logs for webhook delivery
- Verify `SHOPIFY_API_SECRET` is correct

---

## 📊 Summary of URLs You Need

After deployment, you'll have one main URL:

```
https://your-project-name.vercel.app
```

Use this for:
- App URL: `https://your-project-name.vercel.app/`
- Auth URL: `https://your-project-name.vercel.app/auth`
- App Proxy: `https://your-project-name.vercel.app/apps/gachi-rewards`
- Webhooks: `https://your-project-name.vercel.app/webhooks/*`

**This URL never changes!** Set it once and you're done.

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Vercel Postgres database created
- [ ] All environment variables set in Vercel
- [ ] First deployment successful
- [ ] `SHOPIFY_APP_URL` updated with actual Vercel URL
- [ ] `shopify.app.toml` updated with Vercel URL
- [ ] Shopify Partners Dashboard URLs updated
- [ ] App loads in Shopify admin
- [ ] Database tables created
- [ ] Webhooks working
- [ ] App Proxy working

---

**Once complete, you're done! No more tunnel management, no more URL updates. 🎉**
