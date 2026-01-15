# 🚀 Quick Start - Local Development & Testing

Get Gachi Rewards running locally in **5 minutes**.

---

## ✅ Prerequisites (30 seconds)

Check you have:
- **Node.js** 20.19+ or 22.12+: `node --version`
- **npm**: `npm --version`
- **Shopify CLI**: `npm install -g @shopify/cli@latest`
- **Shopify Partner Account** (free): https://partners.shopify.com
- **Development Store** (free): Create at Partners Dashboard → Stores

---

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

---

## Step 2: Database Setup (30 seconds)

The schema is already configured for SQLite (easiest). Just run:

```bash
npm run db:generate
npm run db:migrate
```

When prompted for migration name, type: `init` and press Enter.

> **⚠️ Important:** Make sure Prisma Studio is closed before running migrations. If you get a "database is locked" error, see the troubleshooting section below.

**Verify it worked:**
```bash
npm run db:studio
```
Opens at `http://localhost:5555` - you should see empty tables. **Close it (Ctrl+C) before running any other database commands.**

---

## Step 3: Get Shopify Credentials (2 minutes)

1. Go to https://partners.shopify.com
2. **Apps** → Select your app (or **Create app** → "Custom app" → "Gachi Rewards")
3. **App setup** tab → **API credentials**
4. Copy:
   - **API key**
   - **API secret key** (click "Reveal")

---

## Step 4: Create .env File (30 seconds)

In project root, create `.env`:

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**Mac/Linux:**
```bash
touch .env
```

Add this content (replace with your credentials):

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
```

**Replace:**
- `your_api_key_here` → Your API key from Step 3
- `your_api_secret_here` → Your API secret from Step 3

---

## Step 5: Start Development Server (1 minute)

```bash
npm run dev
```

This will:
- Start your local server at `http://localhost:3000`
- Create a secure tunnel (automatically managed by Shopify CLI)
- Update URLs in Partners Dashboard automatically
- Forward webhooks to your local server

---

## Step 6: Deploy Extensions (1 minute)

Open a **new terminal** (keep dev server running):

```bash
cd gachi-rewards
shopify app deploy
```

Wait for completion (~1-2 minutes). This deploys:
- Thank You Referral Extension
- Checkout Discount Applier
- Storefront Script

---

## Step 7: Install App in Development Store (30 seconds)

1. Go to your development store admin
   - Find at: https://partners.shopify.com → Stores
2. **Apps** → **Develop apps**
3. Find "Gachi Rewards" → **Install**
4. Authorize the app

---

## Step 8: Test It! (2 minutes)

### Test 1: Make a Purchase
1. Go to your development store
2. Add product to cart
3. Checkout as test customer
4. Complete purchase

### Test 2: Check Referral Link
- On the Thank You page, you should see a referral link
- Copy it (e.g., `https://your-store.myshopify.com/?ref=ALICE123`)

### Test 3: Use Referral Link
1. Open referral link in **incognito/private window**
2. Add product to cart
3. Go to checkout
4. **Discount should be applied automatically!** ✅

### Test 4: Verify Database
```bash
npm run db:studio
```
Check `ReferralJoin` table - you should see a record!

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Database migrated
- [ ] `.env` file created with credentials
- [ ] Dev server running (`npm run dev`)
- [ ] App Proxy configured
- [ ] Extensions deployed
- [ ] App installed in development store
- [ ] Test purchase completed
- [ ] Referral link appears on Thank You page
- [ ] Referral link applies discount
- [ ] Database shows records

---

## 🐛 Quick Troubleshooting

**"Command not found: shopify"**
```bash
npm install -g @shopify/cli@latest
```

**"Cannot connect to database"**
- Make sure you ran `npm run db:migrate`
- Check `prisma/dev.sqlite` exists

**"SQLite database error: database is locked"**
This happens when multiple processes try to access the database. Fix it:

1. **Close Prisma Studio** (if open):
   - Find the terminal running `npm run db:studio`
   - Press `Ctrl+C` to stop it

2. **Stop the dev server** (if running):
   - Find the terminal running `npm run dev`
   - Press `Ctrl+C` to stop it

3. **Delete lock files** (if they exist):
   ```bash
   # Windows (PowerShell):
   Remove-Item prisma\dev.sqlite-wal -ErrorAction SilentlyContinue
   Remove-Item prisma\dev.sqlite-shm -ErrorAction SilentlyContinue
   
   # Mac/Linux:
   rm prisma/dev.sqlite-wal prisma/dev.sqlite-shm 2>/dev/null
   ```

4. **Try again**:
   ```bash
   npm run db:migrate
   ```

**Important:** Only run one database operation at a time. Don't run `npm run db:studio` and `npm run db:migrate` at the same time!

**"Socket timeout" or "database failed to respond"**
This can happen with SQLite. Try these fixes:

1. **Restart your dev server**:
   - Stop `npm run dev` (Ctrl+C)
   - Start it again: `npm run dev`

2. **Close Prisma Studio** (if open):
   - Stop `npm run db:studio` (Ctrl+C)

3. **Check database file location**:
   - Make sure `prisma/dev.sqlite` exists
   - If missing, run: `npm run db:migrate`

4. **Disable WAL mode** (if issues persist):
   ```bash
   # Windows (PowerShell)
   sqlite3 prisma\dev.sqlite "PRAGMA journal_mode=DELETE;"
   
   # Mac/Linux
   sqlite3 prisma/dev.sqlite "PRAGMA journal_mode=DELETE;"
   ```

5. **If still failing, recreate database**:
   ```bash
   # Backup first (optional)
   Copy-Item prisma\dev.sqlite prisma\dev.sqlite.backup
   
   # Delete and recreate
   Remove-Item prisma\dev.sqlite
   npm run db:migrate
   ```

**Note:** The code has been updated to not use Prisma Accelerate with SQLite (which was causing timeouts). Make sure you have the latest code.

**"Invalid API credentials"**
- Double-check `.env` file
- No extra spaces or quotes around values

**"App Proxy returns 401"**
- Verify App Proxy URL is configured correctly in Partners Dashboard
- Must end with `/apps/gachi-rewards`
- Shopify CLI should update this automatically when running `shopify app dev`

**Extensions not showing**
- Run `shopify app deploy` again
- Check extension is enabled in theme settings

---

## 🎉 You're Ready!

Your local environment is running. You can now:
- Make code changes (hot-reload enabled)
- Test the referral flow end-to-end
- Debug issues locally
- View database in Prisma Studio (`npm run db:studio`)

---

## 🔧 Quick Commands Reference

```bash
npm run dev          # Start development server
npm run db:studio    # Open database browser
npm run db:migrate   # Run database migrations
shopify app deploy   # Deploy extensions
```

