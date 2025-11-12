# Deploy to Shopify for Testing - Step by Step

Complete guide to deploy and test Gachi Rewards in a Shopify development store.

---

## ✅ Prerequisites

Before starting, make sure you have:

- [ ] **Node.js** 20.19+ or 22.12+ installed
  - Check: `node --version`
  - Download: https://nodejs.org/ if needed
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

**Verify installation:**
```bash
shopify version
```

You should see a version number. If you get an error, make sure Node.js is installed correctly.

---

## Step 2: Navigate to Project

```bash
cd gachi-rewards
```

Make sure you're in the project root directory.

---

## Step 3: Install Dependencies

```bash
npm install
```

This will take 1-2 minutes. Wait for it to complete successfully.

---

## Step 4: Set Up Database (SQLite - Easiest)

For testing, SQLite is the easiest option (no database server needed).

**4a. Update Prisma Schema**

Open `prisma/schema.prisma` in your code editor and find this section (around line 14):

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

**4d. Verify Database (Optional)**

```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555`. You should see empty tables. Close it when done (Ctrl+C in terminal).

---

## Step 5: Create Shopify App

1. Go to https://partners.shopify.com
2. Log in to your Partner account
3. Click **"Apps"** in the left sidebar
4. Click **"Create app"** button
5. Choose **"Custom app"**
6. Enter app name: **"Gachi Rewards"**
7. Click **"Create app"**

---

## Step 6: Get App Credentials

1. In your app, go to **"App setup"** tab
2. Scroll to **"API credentials"** section
3. Copy the **"API key"** (you'll need this)
4. Click **"Reveal"** next to **"API secret key"**
5. Copy the **"API secret key"** (you'll need this)

**Keep these credentials safe** - you'll use them in the next step.

---

## Step 7: Create .env File

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

## Step 8: Add Environment Variables

Open the `.env` file you just created and add these lines:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
```

**Replace the values:**
- `your_api_key_here` → Paste your **API key** from Step 6
- `your_api_secret_here` → Paste your **API secret key** from Step 6

**Example (with real values):**
```env
SHOPIFY_API_KEY=741daef6a0dbfd373e58335c837b9b4f
SHOPIFY_API_SECRET=shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
```

**Save the file.**

---

## Step 9: Start Development Server

```bash
npm run dev
```

**First time setup process:**

1. **Login to Shopify Partners:**
   - The CLI will open a browser window
   - Log in to your Shopify Partners account
   - Authorize the CLI

2. **Select Your App:**
   - The CLI will show a list of your apps
   - Select **"Gachi Rewards"** (the app you created in Step 5)
   - Press Enter

3. **Tunnel URL Created:**
   - The CLI will create a secure tunnel
   - You'll see a URL like: `https://abc123.ngrok.io`
   - **IMPORTANT: Copy this URL** - you'll need it in the next step
   - Example: `https://abc123-def456.ngrok-free.app`

4. **App Opens:**
   - Your app will automatically open in the browser
   - You might see a login page or the app interface

**Keep this terminal window open** - the dev server must stay running!

---

## Step 10: Configure App Proxy in Shopify

1. Go back to https://partners.shopify.com
2. Select your **"Gachi Rewards"** app
3. Go to **"App setup"** tab
4. Scroll down to **"App Proxy"** section
5. Click **"Configure"** or **"Edit"**

6. Fill in the App Proxy settings:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://abc123.ngrok.io/apps/gachi-rewards`
     - Replace `abc123.ngrok.io` with the **actual tunnel URL** from Step 9
     - Make sure it includes `/apps/gachi-rewards` at the end
     - Example: `https://abc123-def456.ngrok-free.app/apps/gachi-rewards`

7. Click **"Save"**

**Important:** The tunnel URL changes each time you restart `npm run dev`. If you restart, update this URL!

---

## Step 11: Update App URL in Shopify

1. Still in **"App setup"** tab
2. Scroll to **"App URL"** section
3. Set **App URL** to your tunnel URL:
   ```
   https://abc123.ngrok.io
   ```
   (Use your actual tunnel URL from Step 9)

4. Scroll to **"Allowed redirection URL(s)"**
5. Add:
   ```
   https://abc123.ngrok.io/auth
   ```
   (Use your actual tunnel URL)

6. Click **"Save"**

---

## Step 12: Deploy Extensions

Open a **new terminal window** (keep the dev server running in the first terminal):

```bash
cd gachi-rewards
shopify app deploy
```

**This will:**
- Deploy the Thank You Referral Extension
- Deploy the Checkout Discount Applier Extension
- Deploy the Storefront Script Extension

Wait for it to complete (1-2 minutes). You should see success messages.

---

## Step 13: Install App in Development Store

1. Go to your development store admin
   - Find it at: https://partners.shopify.com → **Stores**
   - Click on your development store
   - Click **"Open store"** or **"Manage"**

2. In the store admin:
   - Go to **"Apps"** in the left sidebar
   - Click **"Develop apps"** (or **"App and sales channel settings"**)
   - Find **"Gachi Rewards"** in the list
   - Click **"Install"** or **"Enable"**

3. **Authorize the app:**
   - Review the permissions requested
   - Click **"Install app"** or **"Allow"**

The app is now installed in your development store!

---

## Step 14: Test the Referral Flow

### Test 1: Make a Purchase

1. Go to your development store frontend (the public store, not admin)
2. Add a product to cart
3. Go to checkout
4. Complete the purchase as a test customer
5. On the **Thank You page**, you should see:
   - A referral link
   - Text like "🎉 Share your link and give friends 10% off!"
   - A "Copy Referral Link" button

**If you don't see the referral link:**
- Check the browser console for errors (F12)
- Verify extensions were deployed (Step 12)
- Check that the app is installed (Step 13)

### Test 2: Use Referral Link

1. **Copy the referral link** from the Thank You page
   - It should look like: `https://your-store.myshopify.com/?ref=ALICE123`

2. **Open the link in an incognito/private window**
   - This simulates a new customer clicking the link

3. **Add a product to cart**

4. **Go to checkout**
   - You should see a discount applied automatically
   - The discount code should be something like: `GACHI-ALICE123`
   - The discount amount should be 10% (or whatever you configured)

5. **Complete the purchase**

### Test 3: Verify Database Records

1. Open a new terminal
2. Run:
   ```bash
   npm run db:studio
   ```
3. This opens Prisma Studio at `http://localhost:5555`
4. Check the tables:
   - **StorefrontUser** - Should have the customer who made the first purchase
   - **ReferralDiscountCode** - Should have the referral code
   - **ReferralSafeLink** - Should have the one-time link that was created
   - **ReferralJoin** - Should have a record of the referral conversion

**If you see records in these tables, the app is working correctly!**

---

## Step 15: Verify Everything Works

### Checklist

- [ ] Development server running (`npm run dev`)
- [ ] App Proxy configured in Shopify Partners
- [ ] App URL and redirect URL set in Shopify Partners
- [ ] Extensions deployed (`shopify app deploy`)
- [ ] App installed in development store
- [ ] Test purchase completed
- [ ] Referral link appears on Thank You page
- [ ] Referral link works (discount applied in checkout)
- [ ] Database shows records in Prisma Studio

---

## 🐛 Troubleshooting

### "Command not found: shopify"
```bash
npm install -g @shopify/cli@latest
```

### "Cannot connect to database"
- Make sure you updated `prisma/schema.prisma` to use SQLite
- Run `npm run db:migrate` again

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
- Get fresh credentials from Shopify Partners if needed

### "App Proxy returns 401"
- Verify App Proxy URL in Shopify Partners matches your tunnel URL
- Make sure it includes `/apps/gachi-rewards` at the end
- Update the URL if you restarted `npm run dev` (tunnel URL changes)

### Extensions not showing on Thank You page
- Run `shopify app deploy` again
- Check extension is enabled in your theme settings
- Clear browser cache and try again

### Referral link doesn't apply discount
- Check browser console for errors (F12)
- Verify storefront script is deployed
- Make sure you're using the referral link (with `?ref=CODE`)

### Database shows no records
- Make sure `npm run dev` is still running
- Check terminal for any error messages
- Verify webhook is registered in Shopify Partners

---

## 🔄 Restarting the Dev Server

If you need to restart `npm run dev`:

1. **Stop the server** (Ctrl+C in terminal)
2. **Restart:**
   ```bash
   npm run dev
   ```
3. **Get the new tunnel URL** (it will be different)
4. **Update App Proxy URL** in Shopify Partners (Step 10)
5. **Update App URL** in Shopify Partners (Step 11)

---

## 📝 Quick Commands Reference

```bash
npm run dev          # Start development server
npm run db:studio    # Open database browser
npm run db:migrate   # Run database migrations
shopify app deploy   # Deploy extensions
```

---

## ✅ Success!

If you've completed all steps and the checklist, your Gachi Rewards app is:

- ✅ Running locally
- ✅ Connected to Shopify
- ✅ Deployed to your development store
- ✅ Tracking referrals
- ✅ Applying discounts

**You can now:**
- Test the full referral flow
- Make changes to the code (hot-reload enabled)
- View database records in Prisma Studio
- Debug any issues locally

---

## 🚀 Next Steps

Once testing is complete:
- See [SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md) to deploy to Vercel for production
- Test with multiple customers
- Verify multi-tenant functionality
- Check webhook processing

---

**Need help?** Review the troubleshooting section above or check [SETUP-LOCAL.md](./SETUP-LOCAL.md) for more detailed setup instructions.

