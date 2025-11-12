# Local Development Setup

Complete step-by-step guide to get Gachi Rewards running locally.

---

## ✅ Prerequisites Check

Before starting, make sure you have:

- [ ] **Node.js** 20.19+ or 22.12+ installed
  - Check: `node --version`
  - Download: https://nodejs.org/
- [ ] **npm** installed (comes with Node.js)
  - Check: `npm --version`
- [ ] **Shopify Partner Account** (free)
  - Sign up: https://partners.shopify.com
- [ ] **Development Store** (free)
  - Create at: https://partners.shopify.com → Stores → Add store

---

## Step 1: Install Shopify CLI

Open terminal/command prompt and run:

```bash
npm install -g @shopify/cli@latest
```

Verify installation:
```bash
shopify version
```

---

## Step 2: Navigate to Project

```bash
cd gachi-rewards
```

---

## Step 3: Install Dependencies

```bash
npm install
```

This will take 1-2 minutes. Wait for it to complete.

---

## Step 4: Set Up Database (Choose One Option)

### Option A: SQLite (Easiest - Recommended)

**4a. Update Prisma Schema for SQLite**

Open `prisma/schema.prisma` and find this section (around line 14):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Change it to:**

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.sqlite"
}
```

**4b. Generate Prisma Client**

```bash
npm run db:generate
```

**4c. Run Migrations**

```bash
npm run db:migrate
```

When prompted for a migration name, type: `init_local_dev` and press Enter.

**4d. Verify Database**

```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555`. You should see empty tables. Close it when done (Ctrl+C in terminal).

---

### Option B: Local PostgreSQL (More Production-Like)

**4a. Install PostgreSQL**

- **Windows**: Download installer from https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql@15`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`
- **Docker**: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

**4b. Create Database**

Open terminal and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE gachi_rewards;

# Exit
\q
```

**4c. Keep Prisma Schema as-is** (it already uses PostgreSQL)

**4d. Generate Prisma Client**

```bash
npm run db:generate
```

**4e. Run Migrations**

```bash
npm run db:migrate
```

When prompted for a migration name, type: `init_local_dev` and press Enter.

---

## Step 5: Get Shopify App Credentials

1. Go to https://partners.shopify.com
2. Log in to your Partner account
3. Click **"Apps"** in the left sidebar
4. Either:
   - **Select existing app**, OR
   - **Click "Create app"** → Choose "Custom app" → Name it "Gachi Rewards" → Create
5. Click on your app
6. Go to **"App setup"** tab
7. Scroll to **"API credentials"**
8. Copy:
   - **API key** (you'll need this)
   - **API secret key** (click "Reveal" to see it - you'll need this)

---

## Step 6: Create .env File

In the project root (`gachi-rewards` folder), create a file named `.env`

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**Mac/Linux:**
```bash
touch .env
```

---

## Step 7: Add Environment Variables

Open the `.env` file you just created and add these lines:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
NODE_ENV=development
```

**Replace the values:**
- `your_api_key_here` → Paste your **API key** from Step 5
- `your_api_secret_here` → Paste your **API secret key** from Step 5

**If using SQLite**, also add:
```env
DATABASE_URL="file:./prisma/dev.sqlite"
```

**If using PostgreSQL**, also add:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gachi_rewards"
```

**Your complete `.env` file should look like this (with SQLite):**

```env
SHOPIFY_API_KEY=741daef6a0dbfd373e58335c837b9b4f
SHOPIFY_API_SECRET=shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
```

---

## Step 8: Start Development Server

```bash
npm run dev
```

**First time setup:**
1. The CLI will ask you to log in to Shopify Partners
   - It will open a browser window
   - Log in and authorize
2. It will ask you to select an app
   - Choose the app you created/selected in Step 5
3. It will create a secure tunnel
   - You'll see a URL like: `https://abc123.ngrok.io`
   - **Copy this URL** - you'll need it in the next step
4. Your app will open in the browser automatically

**Keep this terminal window open** - the dev server is running!

---

## Step 9: Configure App Proxy in Shopify

1. Go back to https://partners.shopify.com
2. Select your app → **"App setup"** tab
3. Scroll to **"App Proxy"** section
4. Configure:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://abc123.ngrok.io/apps/gachi-rewards`
     - Replace `abc123.ngrok.io` with the URL from Step 8
5. Click **"Save"**

---

## Step 10: Deploy Extensions

Open a **new terminal window** (keep the dev server running in the first one):

```bash
cd gachi-rewards
shopify app deploy
```

This deploys:
- Thank You Referral Extension
- Checkout Discount Applier
- Storefront Script

Wait for it to complete (1-2 minutes).

---

## Step 11: Install App in Development Store

1. Go to your development store admin
   - Find it at: https://partners.shopify.com → Stores
2. In the store admin, go to **"Apps"** → **"Develop apps"**
3. Find your app and click **"Install"**
4. Authorize the app

---

## Step 12: Test the App

1. **Make a test purchase:**
   - Go to your development store
   - Add a product to cart
   - Checkout as a test customer
   - Complete the purchase

2. **Check Thank You page:**
   - You should see a referral link
   - Copy the referral link

3. **Test referral link:**
   - Open the referral link in an incognito/private window
   - Add a product to cart
   - Go to checkout
   - You should see the discount applied automatically

4. **Verify database:**
   - Open a new terminal
   - Run: `npm run db:studio`
   - Check the `ReferralJoin` table - you should see a record!

---

## ✅ Success Checklist

- [ ] Shopify CLI installed
- [ ] Dependencies installed (`npm install`)
- [ ] Database set up (SQLite or PostgreSQL)
- [ ] Migrations run successfully
- [ ] `.env` file created with credentials
- [ ] Development server running (`npm run dev`)
- [ ] App Proxy configured in Shopify Partners
- [ ] Extensions deployed (`shopify app deploy`)
- [ ] App installed in development store
- [ ] Test purchase completed
- [ ] Referral link appears on Thank You page
- [ ] Referral link works (discount applied)
- [ ] Database shows records

---

## 🐛 Troubleshooting

### "Command not found: shopify"
```bash
npm install -g @shopify/cli@latest
```

### "Cannot connect to database"
- **SQLite**: Make sure you updated `prisma/schema.prisma` to use SQLite
- **PostgreSQL**: Make sure PostgreSQL is running and database exists

### "SQLite database error: database is locked"
This happens when multiple processes try to access the database. Fix it:

1. **Close Prisma Studio** (if open):
   - Find the terminal running `npm run db:studio`
   - Press `Ctrl+C` to stop it

2. **Stop the dev server** (if running):
   - Find the terminal running `npm run dev`
   - Press `Ctrl+C` to stop it

3. **Delete lock files** (if they exist):
   ```bash
   # Windows (PowerShell) - Quick fix script:
   .\scripts\fix-database-locked.ps1
   
   # Or manually:
   Remove-Item prisma\dev.sqlite-wal -ErrorAction SilentlyContinue
   Remove-Item prisma\dev.sqlite-shm -ErrorAction SilentlyContinue
   
   # Mac/Linux - Quick fix script:
   ./scripts/fix-database-locked.sh
   
   # Or manually:
   rm prisma/dev.sqlite-wal prisma/dev.sqlite-shm 2>/dev/null
   ```

4. **Try again**:
   ```bash
   npm run db:migrate
   ```

**Important:** Only run one database operation at a time. Don't run `npm run db:studio` and `npm run db:migrate` at the same time!

### "Socket timeout" or "database failed to respond"
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
   # Windows (PowerShell) - requires sqlite3 CLI
   sqlite3 prisma\dev.sqlite "PRAGMA journal_mode=DELETE;"
   
   # Mac/Linux
   sqlite3 prisma/dev.sqlite "PRAGMA journal_mode=DELETE;"
   ```

5. **If still failing, recreate database**:
   ```bash
   # Backup first (optional)
   # Windows
   Copy-Item prisma\dev.sqlite prisma\dev.sqlite.backup
   # Mac/Linux
   cp prisma/dev.sqlite prisma/dev.sqlite.backup
   
   # Delete and recreate
   # Windows
   Remove-Item prisma\dev.sqlite
   # Mac/Linux
   rm prisma/dev.sqlite
   
   npm run db:migrate
   ```

**Note:** The code has been updated to not use Prisma Accelerate with SQLite (which was causing timeouts). Make sure you have the latest code.

### "Invalid API credentials"
- Double-check your `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` in `.env`
- Make sure there are no extra spaces or quotes

### "App Proxy returns 401"
- Verify App Proxy URL in Shopify Partners matches your tunnel URL
- Make sure it includes `/apps/gachi-rewards` at the end

### Extensions not showing
- Run `shopify app deploy` again
- Check extension is enabled in your theme settings

---

## 🎉 You're Done!

Your local development environment is set up and running. You can now:
- Make code changes and see them hot-reload
- Test the referral flow
- Debug issues locally
- View database records in Prisma Studio

**Next Steps:**
- When ready for production, see [SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md)

---

## Quick Commands Reference

```bash
npm run dev          # Start development server
npm run db:studio    # Open database browser
npm run db:migrate   # Run database migrations
shopify app deploy   # Deploy extensions
```

---

**Need help?** Review the troubleshooting section above or check [SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md) for production deployment.

