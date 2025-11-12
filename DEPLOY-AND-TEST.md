# Deploy and Test Gachi Rewards on Shopify - Complete Guide

Step-by-step instructions to deploy and test your Gachi Rewards app in a Shopify development store.

---

## ✅ Prerequisites Checklist

Before starting, verify you have:

- [ ] **Node.js** 20.19+ or 22.12+ installed
  - Check: `node --version`
  - Download: https://nodejs.org/ if needed
- [ ] **npm** installed (comes with Node.js)
  - Check: `npm --version`
- [ ] **Shopify CLI** installed globally
  - Check: `shopify version`
  - Install: `npm install -g @shopify/cli@latest`
- [ ] **Shopify Partner Account** (free)
  - Sign up: https://partners.shopify.com
- [ ] **Development Store** (free)
  - Create at: https://partners.shopify.com → Stores → Add store
- [ ] **App created in Partners Dashboard**
  - Go to: https://partners.shopify.com → Apps → Create app
  - Note your app's API credentials

---

## Step 1: Install Extension Dependencies

The React-based checkout extensions need their dependencies installed:

```bash
# Install dependencies for thank-you-referral extension
cd extensions/thank-you-referral
npm install
cd ../checkout-discount-applier
npm install
cd ../..
```

**Verify installation:**
- Check that `node_modules` folders exist in both extension directories
- No errors should appear

---

## Step 2: Verify Environment Variables

Make sure your `.env` file exists and contains:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,write_customers,write_orders,write_discounts,read_orders
DATABASE_URL=file:./dev.sqlite
NODE_ENV=development
```

**Important:** The `SHOPIFY_APP_URL` will be updated automatically when you start the dev server with a tunnel URL.

---

## Step 3: Start Development Server

Open a terminal in your project root and run:

```bash
npm run dev
```

**What happens:**

1. **Browser opens automatically** → Log in to Shopify Partners
2. **Select your app** → Choose "Gachi Rewards" from the list
3. **Tunnel URL created** → You'll see something like:
   ```
   ┌─────────────────────────────────────────────────┐
   │  App URL: https://abc123-def456.ngrok-free.app  │
   └─────────────────────────────────────────────────┘
   ```
4. **Copy this URL** - You'll need it in the next steps!
5. **App opens in browser** - Your app interface should load

**⚠️ Keep this terminal window open!** The dev server must stay running.

---

## Step 4: Configure App Proxy in Shopify Partners

1. Go to: **https://partners.shopify.com**
2. Click on your **"Gachi Rewards"** app
3. Go to **"App setup"** tab
4. Scroll down to **"App Proxy"** section
5. Click **"Configure"** or **"Edit"**

6. Fill in the App Proxy settings:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://abc123-def456.ngrok-free.app/apps/gachi-rewards`
     - ⚠️ Replace `abc123-def456.ngrok-free.app` with your **actual tunnel URL** from Step 3
     - ⚠️ Must end with `/apps/gachi-rewards`

7. Click **"Save"**

**Note:** If you restart `npm run dev`, the tunnel URL changes. Update this URL if needed.

---

## Step 5: Set App URL in Shopify Partners

1. Still in **"App setup"** tab
2. Scroll to **"App URL"** section
3. Set **App URL** to your tunnel URL:
   ```
   https://abc123-def456.ngrok-free.app
   ```
   (Use your actual tunnel URL from Step 3, **not** localhost)

4. Click **"Save"**

---

## Step 6: Set Allowed Redirection URL

1. Still in **"App setup"** tab
2. Scroll to **"Allowed redirection URL(s)"** section
3. Add:
   ```
   https://abc123-def456.ngrok-free.app/auth
   ```
   (Use your tunnel URL + `/auth`)

4. Click **"Save"**

---

## Step 7: Deploy Extensions

Open a **NEW terminal window** (keep the dev server running in the first terminal):

```bash
cd gachi-rewards
shopify app deploy
```

**This will deploy:**
- ✅ Thank You Referral Extension (checkout UI extension)
- ✅ Checkout Discount Applier Extension (checkout UI extension)
- ✅ Storefront Script Extension (theme app extension - app embed block)

**Wait for completion** (1-2 minutes). You should see:
```
✓ Deployed extensions successfully
```

**If you see errors:**
- Make sure extension dependencies are installed (Step 1)
- Check that the dev server is still running
- Verify your Shopify CLI is up to date: `shopify upgrade`

---

## Step 8: Install App in Development Store

1. Go to: **https://partners.shopify.com** → **Stores**
2. Click on your **development store**
3. Click **"Open store"** or **"Manage"**

4. In the store admin:
   - Go to **"Apps"** in the left sidebar
   - Click **"Develop apps"** (or **"App and sales channel settings"**)
   - Find **"Gachi Rewards"** in the list
   - Click **"Install"** or **"Enable"**

5. **Authorize the app:**
   - Review the permissions requested
   - Click **"Install app"** or **"Allow"**

✅ **App is now installed!**

---

## Step 9: Enable App Embed Block (Storefront Script)

The storefront script is deployed as an **app embed block** that needs to be enabled:

1. In your store admin, go to: **Online Store** → **Themes**
2. Click **"Customize"** on your active theme
3. In the theme editor:
   - Look for **"Theme settings"** in the left sidebar (bottom)
   - Click **"Theme settings"**
   - Scroll down to **"App embeds"** section
   - Find **"Gachi Rewards Referral Script"**
   - **Enable the toggle** to turn it on
4. Click **"Save"** (top right)

**Alternative method (if App embeds section not visible):**
- Some themes may require you to add it manually
- Go to: **Online Store** → **Themes** → **Actions** → **Edit code**
- Open `layout/theme.liquid`
- Look for `</body>` tag
- The app embed should auto-inject, but you can verify it's loading

**✅ App embed block is now enabled!**

---

## Step 10: Test - Make a Purchase

### Test 1: Complete a Purchase

1. Go to your **store frontend** (public store, not admin)
   - URL: `https://your-store.myshopify.com`
   - Or click **"View store"** from the admin

2. **Add a product to cart**
   - Browse products
   - Click "Add to cart"

3. **Go to checkout**
   - Click cart icon
   - Click "Check out"

4. **Complete the purchase** as a test customer:
   - Fill in shipping information
   - Choose shipping method
   - Enter payment details (use test mode)
   - Complete the order

5. **On the Thank You page**, you should see:
   - ✅ A referral link displayed
   - ✅ Text like "🎉 Share your link and give friends 10% off!"
   - ✅ A "Copy Referral Link" button

**If you don't see the referral link:**
- Check browser console for errors (F12 → Console tab)
- Verify extensions were deployed (Step 7)
- Check that the app is installed (Step 8)
- Make sure the dev server is still running

---

## Step 11: Test - Use Referral Link

### Test 2: Apply Referral Discount

1. **Copy the referral link** from the Thank You page
   - It should look like: `https://your-store.myshopify.com/?ref=ALICE123`
   - Click the "Copy Referral Link" button

2. **Open the link in an incognito/private window**
   - This simulates a new customer clicking the link
   - Press `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)

3. **Add a product to cart**
   - Browse and add any product

4. **Go to checkout**
   - You should see:
     - ✅ Discount applied automatically
     - ✅ Discount code visible (e.g., `GACHI-ALICE123`)
     - ✅ Discount amount shown (e.g., 10% off)

5. **Complete the purchase**

**If discount doesn't apply:**
- Check browser console for errors (F12)
- Verify app embed block is enabled (Step 9)
- Make sure you're using the referral link (with `?ref=CODE`)
- Check that App Proxy is configured correctly (Step 4)
- Verify the storefront script is loading (Network tab in browser dev tools)

---

## Step 12: Verify Database Records

1. Open a **new terminal**
2. Run:
   ```bash
   npm run db:studio
   ```
3. **Prisma Studio opens** at `http://localhost:5555`

4. **Check these tables:**

   **StorefrontUser:**
   - Should have records for customers who made purchases
   - Check for the customer who made the first purchase

   **ReferralDiscountCode:**
   - Should have the referral code created
   - Check `code` field (e.g., `ALICE123`)

   **ReferralSafeLink:**
   - Should have the one-time link that was created
   - Check `oneTimeCode` and `discountCode` fields

   **ReferralJoin:**
   - Should have a record of the referral conversion
   - Links the referrer to the new customer

**✅ If you see records in these tables, the app is working correctly!**

---

## Step 13: Success Checklist

Verify everything is working:

- [ ] Extension dependencies installed (Step 1)
- [ ] Development server running (`npm run dev`) (Step 3)
- [ ] App Proxy configured in Shopify Partners (Step 4)
- [ ] App URL set in Shopify Partners (Step 5)
- [ ] Redirect URL set in Shopify Partners (Step 6)
- [ ] Extensions deployed successfully (`shopify app deploy`) (Step 7)
- [ ] App installed in development store (Step 8)
- [ ] App embed block enabled in theme (Step 9)
- [ ] Test purchase completed (Step 10)
- [ ] Referral link appears on Thank You page (Step 10)
- [ ] Referral link applies discount in checkout (Step 11)
- [ ] Database shows records in Prisma Studio (Step 12)

---

## Troubleshooting

### ❌ App Proxy returns 401 Unauthorized

**Solution:**
- Verify App Proxy URL matches your tunnel URL exactly
- Must end with `/apps/gachi-rewards`
- Update URL if you restarted `npm run dev` (tunnel URL changes)

### ❌ Extensions not showing

**Solution:**
- Run `shopify app deploy` again
- Check extension is enabled in theme settings
- Clear browser cache (Ctrl+Shift+R)
- Verify extensions are listed in Partners Dashboard → App setup → Extensions

### ❌ Referral link doesn't apply discount

**Solution:**
- Check browser console for errors (F12)
- Verify app embed block is enabled (Step 9)
- Make sure you're using the referral link (with `?ref=CODE`)
- Check that App Proxy is configured correctly
- Verify the storefront script is loading (Network tab in browser dev tools)
- Check that `applyReferral.js` is loading from assets

### ❌ Database shows no records

**Solution:**
- Make sure `npm run dev` is still running
- Check terminal for error messages
- Verify webhook is registered in Shopify Partners
- Check that order was completed successfully
- Verify database file exists: `prisma/dev.sqlite`

### ❌ App embed block not appearing

**Solution:**
- Make sure extension was deployed successfully
- Check Online Store → Themes → Customize → Theme settings → App embeds
- Try refreshing the theme editor
- Verify the block is listed in Partners Dashboard → App setup → Extensions

### ❌ Thank You page extension not showing

**Solution:**
- Verify checkout UI extension was deployed
- Check that you're on the actual Thank You page (not order status page)
- Check browser console for errors
- Make sure the order was completed successfully
- Verify customer information is available (extension needs customer ID)

---

## Quick Commands Reference

```bash
# Install extension dependencies
cd extensions/thank-you-referral && npm install && cd ../checkout-discount-applier && npm install && cd ../..

# Start development server
npm run dev

# Deploy extensions (in new terminal)
shopify app deploy

# Open database browser
npm run db:studio

# Check Shopify CLI version
shopify version

# Upgrade Shopify CLI
shopify upgrade
```

---

## Important Notes

1. **Keep dev server running** - If you stop it, the tunnel URL changes and you'll need to update Shopify Partners settings (Steps 4-6)

2. **Tunnel URL changes** - Each time you restart `npm run dev`, update the URLs in Shopify Partners

3. **Test in incognito** - Use incognito/private window to test referral links as a new customer

4. **App embed block** - Must be enabled in Theme Settings → App embeds for the storefront script to work

5. **Database location** - SQLite database is at `prisma/dev.sqlite` (for local development)

6. **Production deployment** - For production, you'll need to:
   - Set up a production database (PostgreSQL)
   - Deploy your app to a hosting service (Vercel, etc.)
   - Update App Proxy URL to your production URL
   - Update App URL to your production URL

---

## Next Steps

Once testing is complete:

1. **Test edge cases:**
   - Multiple referrals from same customer
   - Expired referral links
   - Invalid referral codes

2. **Monitor performance:**
   - Check database query performance
   - Monitor API response times
   - Check error logs

3. **Prepare for production:**
   - Set up production database
   - Configure environment variables
   - Set up monitoring and logging
   - Review security settings

---

## Need Help?

- **Shopify CLI Docs:** https://shopify.dev/docs/apps/tools/cli
- **Theme App Extensions:** https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
- **Checkout UI Extensions:** https://shopify.dev/docs/apps/checkout
- **App Proxy:** https://shopify.dev/docs/apps/online-store/app-proxies

---

**You're all set! Follow these steps to deploy and test your Gachi Rewards app.** 🚀

