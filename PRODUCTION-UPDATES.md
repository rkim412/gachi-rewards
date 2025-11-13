# Production Configuration Updates

This document summarizes all the changes made to configure the Gachi Rewards app for production deployment on Vercel with PostgreSQL.

---

## ✅ Files Updated

### 1. `shopify.app.toml`
**Updated App Proxy and Auth URLs for production:**

- **App Proxy URL**: Changed from tunnel URL to `https://gachi-rewards.vercel.app/apps/gachi-rewards`
- **Auth Redirect URL**: Changed from tunnel URL to `https://gachi-rewards.vercel.app/auth`
- **Application URL**: Already set to `https://gachi-rewards.vercel.app` ✅

### 2. `package.json`
**Added production setup script:**

- **New script**: `setup:prod` - Uses `prisma migrate deploy` for production (applies existing migrations)
- **Existing script**: `setup` - Still uses `prisma migrate dev` for local development (creates new migrations)

### 3. `vercel.json`
**Updated build command for production:**

- **Changed**: `npm run setup` → `npm run setup:prod`
- **Reason**: Production should use `migrate deploy` (applies migrations) not `migrate dev` (creates migrations)

### 4. `.env copy.example`
**Updated with production values and documentation:**

- Updated `SHOPIFY_APP_URL` to production Vercel URL
- Added detailed comments explaining where to get each value
- Updated `DATABASE_URL` format to show Vercel Postgres format
- Added note about using `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)

---

## 📋 Production Configuration Summary

### Shopify App Configuration (`shopify.app.toml`)

```toml
application_url = "https://gachi-rewards.vercel.app"

[app_proxy]
url = "https://gachi-rewards.vercel.app/apps/gachi-rewards"
subpath = "gachi-rewards"
prefix = "apps"

[auth]
redirect_urls = [ "https://gachi-rewards.vercel.app/auth" ]
```

### Vercel Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://gachi-rewards.vercel.app
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL=postgres://... (from POSTGRES_PRISMA_URL)
NODE_ENV=production
WEBHOOK_SECRET=your_webhook_secret (optional)
```

### Shopify Partners Dashboard

Update these in Partners Dashboard → Your App → App setup:

- **App URL**: `https://gachi-rewards.vercel.app`
- **Allowed redirection URL(s)**: `https://gachi-rewards.vercel.app/auth`
- **App Proxy URL**: `https://gachi-rewards.vercel.app/apps/gachi-rewards`
  - Subpath prefix: `apps`
  - Subpath: `gachi-rewards`

---

## 🔄 Migration Strategy

### Local Development
- Uses: `npm run setup` → `prisma migrate dev`
- Creates new migration files
- Uses SQLite database

### Production (Vercel)
- Uses: `npm run setup:prod` → `prisma migrate deploy`
- Applies existing migrations
- Uses PostgreSQL database (Vercel Postgres)

---

## ✅ Next Steps

1. **Commit and push changes:**
   ```bash
   git add shopify.app.toml package.json vercel.json ".env copy.example"
   git commit -m "Update configuration for production deployment"
   git push origin main
   ```

2. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add/update all required variables (see above)

3. **Update Shopify Partners Dashboard:**
   - Go to Partners Dashboard → Your App → App setup
   - Update App URL, Redirect URL, and App Proxy URL

4. **Deploy to Vercel:**
   - Vercel will automatically deploy when you push to main
   - Or manually trigger deployment from Vercel Dashboard

5. **Verify deployment:**
   - Check Vercel logs for successful build
   - Verify database migrations ran successfully
   - Test App Proxy endpoint

---

## 🗄️ Database Notes

### Prisma Schema
- Currently configured for SQLite (local dev)
- Will automatically use PostgreSQL when `DATABASE_URL` points to PostgreSQL
- No schema changes needed - Prisma handles both databases

### Vercel Postgres
- Use `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- Includes connection pooling (`pgbouncer=true`)
- Required for Prisma in serverless environments

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Vercel deployment successful
- [ ] Database migrations completed (check Vercel logs)
- [ ] Environment variables set correctly in Vercel
- [ ] Shopify Partners Dashboard URLs updated
- [ ] App Proxy working (test: `https://your-store.myshopify.com/apps/gachi-rewards/api/generate`)
- [ ] Webhooks working (check Vercel logs)
- [ ] Database tables created (check Vercel Storage → Database → Data)

---

## 📝 Important Notes

1. **App Proxy URL is now permanent** - No need to update when restarting dev server
2. **Database migrations** - Production uses `migrate deploy`, local uses `migrate dev`
3. **Environment variables** - Must be set in Vercel Dashboard (not `.env` file)
4. **SHOPIFY_API_SECRET** - Must match exactly between Vercel and Partners Dashboard

---

**All production configuration updates are complete!** 🚀

