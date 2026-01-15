# 🧪 Complete Testing Guide - Gachi Rewards

## 📋 Table of Contents

1. [Dev Server Management](#-dev-server-management)
2. [Pre-Testing Setup](#-pre-testing-setup-checklist)
3. [Environment Variables](#-environment-variables-to-update)
4. [Core Features Testing](#-core-features-testing)
5. [Database Verification](#-database-verification)
6. [Common Issues & Fixes](#-common-issues--fixes)

---

## 🖥️ Dev Server Management

### Starting the Dev Server

**Command:**
```bash
npm run dev
```

**What it does:**
- Starts local server at `http://localhost:3000`
- Creates secure tunnel (automatically managed by Shopify CLI)
- Updates URLs in Partners Dashboard automatically
- Forwards webhooks to your local server
- Enables hot-reload for code changes

**Expected output:**
```
✓ Server running at http://localhost:3000
✓ Tunnel created at https://abc123.ngrok.io
✓ Webhooks configured
```

**Keep this terminal open** - the dev server must stay running.

---

### Stopping the Dev Server

**Method 1: Graceful shutdown (recommended)**
1. Find the terminal running `npm run dev`
2. Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac)
3. Wait for "Server stopped" message

**Method 2: Force stop**
- Close the terminal window
- Or use Task Manager (Windows) / Activity Monitor (Mac) to kill the process

**Important:** Always stop the dev server gracefully before closing your terminal.

---

### When to Restart the Dev Server

**Restart required for:**

1. **Environment variable changes** (`.env` file)
   - After adding/updating `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - After changing `SHOPIFY_API_KEY` or `SHOPIFY_API_SECRET`
   - After changing `DATABASE_URL`
   - After changing `SHOPIFY_APP_URL`

2. **Database schema changes** (Prisma)
   - After running `npm run db:migrate`
   - After modifying `prisma/schema.prisma`
   - Run `npm run db:generate` first, then restart dev server

3. **Configuration file changes**
   - After modifying `shopify.app.toml`
   - After modifying `vite.config.js`
   - After modifying `react-router.config.ts`

4. **Package/dependency changes**
   - After running `npm install`
   - After adding/removing npm packages

5. **Server-side code changes that don't hot-reload**
   - If hot-reload isn't working
   - After major refactoring
   - If you see errors about modules not found

**No restart needed for:**

- ✅ **React component changes** (hot-reloads automatically)
- ✅ **Route handler changes** (hot-reloads automatically)
- ✅ **Service function changes** (hot-reloads automatically)
- ✅ **CSS/styling changes** (hot-reloads automatically)
- ✅ **TypeScript type changes** (hot-reloads automatically)

**How to restart:**
1. Stop dev server: `Ctrl+C` in the terminal
2. Start again: `npm run dev`

---

### Extension Deployment

**When to deploy extensions:**

1. **After modifying extension code:**
   - `extensions/storefront-script/assets/applyReferral.js`
   - `extensions/checkout-discount-applier/src/index.jsx`
   - `extensions/thank-you-referral/src/index.jsx`
   - `extensions/referral-discount-function/src/*.rs` or `*.graphql`

2. **After modifying extension configuration:**
   - `extensions/*/shopify.extension.toml` files

**Command:**
```bash
shopify app deploy
```

**Important:**
- Run this in a **new terminal** (keep dev server running)
- Wait for completion (~1-2 minutes)
- Extensions deploy to Shopify, not your local server

**What gets deployed:**
- Thank You Referral Extension
- Checkout Discount Applier
- Storefront Script
- Discount Function (Rust)

**No need to restart dev server** after deploying extensions.

---

## 📋 Pre-Testing Setup Checklist

Before testing, ensure you have:

- [ ] **Database setup complete**
  - Run: `npm run db:generate && npm run db:migrate`
  - Verify: `npm run db:studio` shows empty tables

- [ ] **Environment variables configured**
  - File: `.env` (in project root)
  - All required variables set (see below)

- [ ] **Dev server running**
  - Run: `npm run dev`
  - Should show tunnel URL (e.g., `https://abc123.ngrok.io`)

- [ ] **Extensions deployed**
  - Run: `shopify app deploy` (in new terminal)
  - Wait for completion

- [ ] **App installed in development store**
  - Go to: Development Store → Apps → Develop apps
  - Install "Gachi Rewards"

---

## 🔧 Environment Variables to Update

### File: `.env` (in project root)

**Required variables:**
```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"
NODE_ENV=development
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token_here
WEBHOOK_SECRET=your_webhook_secret_here
```

**Where to find each:**

1. **`SHOPIFY_API_KEY` & `SHOPIFY_API_SECRET`**
   - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → API credentials
   - Copy API key and API secret key (click "Reveal")

2. **`SHOPIFY_STOREFRONT_ACCESS_TOKEN`**
   - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → API credentials → Storefront API
   - Click "Configure" or "Enable"
   - Enable scopes: `read_cart`, `write_cart`
   - Copy the Storefront API access token (different from Admin API token)

3. **`WEBHOOK_SECRET`** (Optional but recommended)
   - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → Webhooks → Webhook signing secret
   - Copy the webhook signing secret

**After updating `.env`:**
- **Restart dev server** (stop with `Ctrl+C`, then `npm run dev`)

---

## 🎯 Core Features Testing

### Feature 1: Referral Code Generation (After Purchase)

**What it does:** When a customer completes a purchase, they automatically get a referral code.

**Files involved:**
- `app/routes/webhooks.orders.create.jsx` - Webhook handler
- `app/services/webhook-processor.server.js` - Processes order webhook
- `app/services/referral.server.js` - Creates referral codes
- `app/routes/apps.gachi-rewards.api.generate.jsx` - API endpoint for Thank You page
- `extensions/thank-you-referral/src/index.jsx` - Thank You page extension

**Testing Steps:**

1. **Make a test purchase:**
   - Go to your development store
   - Add product to cart
   - Checkout as guest or logged-in customer
   - Complete purchase

2. **Check Thank You page:**
   - After purchase, you should see referral link on Thank You page
   - Format: `https://your-store.myshopify.com/?ref=ALICE123`
   - Copy the referral code (e.g., `ALICE123`)

3. **Verify in database:**
   ```bash
   npm run db:studio
   ```
   - Open: `http://localhost:5555`
   - Check `StorefrontUser` table:
     - Should have new record with customer email
     - `storefrontUserId` should match customer ID
   - Check `ReferralDiscountCode` table:
     - Should have new record with `referralCode` (e.g., `ALICE123`)
     - `discountCode` should be `GACHI-ALICE123`

4. **Verify in Shopify:**
   - Go to: Shopify Admin → Discounts
   - Look for discount code: `GACHI-ALICE123`
   - Should exist and be active

**What to update if it fails:**
- **File:** `.env`
  - Check `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
  - Check `WEBHOOK_SECRET` is set (optional but recommended)
- **File:** `app/services/referral.server.js`
  - Check `findOrCreateReferralCode` function (lines 33-150)
- **File:** `app/services/discount.server.js`
  - Check `createShopifyDiscount` function
- **Shopify Partners Dashboard:**
  - Verify webhook is configured: `orders/create`
  - Check webhook URL is correct (should be tunnel URL when dev server running)
  - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → Webhooks

**Restart needed:** Yes, if you modify `.env` or webhook processing code.

---

### Feature 2: Safe Link Creation (Referral Link Clicked)

**What it does:** When someone clicks a referral link (`?ref=ALICE123`), a secure one-time discount code is created.

**Files involved:**
- `extensions/storefront-script/assets/applyReferral.js` - Detects referral code in URL
- `app/routes/apps.gachi-rewards.api.safe-link.jsx` - Creates safe link
- `app/services/referral.server.js` - `createSafeLink` function (lines 180-250)
- `app/routes/apps.gachi-rewards.api.set-cart-metafields.jsx` - Sets cart metafields

**Testing Steps:**

1. **Get a referral link:**
   - Complete Feature 1 test first
   - Copy referral link: `https://your-store.myshopify.com/?ref=ALICE123`

2. **Click referral link:**
   - Open in **incognito/private window**
   - Visit: `https://your-store.myshopify.com/?ref=ALICE123`
   - Open browser console (F12)

3. **Check console logs:**
   - Should see: `Referral discount applied: GACHI-ALICE123-ABC1 (via metafields)` or `(via attributes)`
   - If you see "(via metafields)" = Storefront API token working ✅
   - If you see "(via attributes)" = Fallback working (token may not be set) ⚠️

4. **Check network requests:**
   - Open DevTools → Network tab
   - Look for: `/apps/gachi-rewards/api/safe-link`
   - Response should be: `{ success: true, shopifyDiscountCode: "GACHI-ALICE123-ABC1" }`
   - Look for: `/apps/gachi-rewards/api/set-cart-metafields` (if metafields working)
   - Response should be: `{ success: true }`

5. **Verify in database:**
   ```bash
   npm run db:studio
   ```
   - Check `ReferralSafeLink` table:
     - Should have new record
     - `oneTimeCode` should match format: `ALICE123-ABC123XYZ`
     - `discountCode` should be `GACHI-ALICE123-ABC1`
     - `used` should be `false`
     - `expiresAt` should be in future

6. **Verify in Shopify:**
   - Go to: Shopify Admin → Discounts
   - Look for discount code: `GACHI-ALICE123-ABC1`
   - Should exist and be active

**What to update if it fails:**
- **File:** `.env`
  - Check `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set (for metafields)
  - Check `SHOPIFY_APP_URL` is `http://localhost:3000`
- **File:** `extensions/storefront-script/assets/applyReferral.js`
  - Check `applyReferral` function (lines 80-150)
  - Check `setCartMetafields` function (lines 48-80)
  - Check `storeReferralDiscountInCart` function (lines 20-46)
- **File:** `app/routes/apps.gachi-rewards.api.safe-link.jsx`
  - Check App Proxy signature verification (lines 15-23)
  - Check safe link creation logic (lines 25-60)
- **Shopify Partners Dashboard:**
  - Verify App Proxy is configured
  - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → App Proxy
  - URL should be: `http://localhost:3000/apps/gachi-rewards` (or tunnel URL)
  - Subpath: `gachi-rewards`, Prefix: `apps`

**Restart needed:** 
- Yes, if you modify `.env` or server-side code
- No, if you only modify `applyReferral.js` (just redeploy extension: `shopify app deploy`)

---

### Feature 3: Discount Application (At Checkout)

**What it does:** When customer proceeds to checkout with a referral discount, the discount is automatically applied.

**Files involved:**
- `extensions/referral-discount-function/src/run.graphql` - GraphQL query for cart data
- `extensions/referral-discount-function/src/cart_lines_discounts_generate_run.rs` - Discount logic
- `extensions/checkout-discount-applier/src/index.jsx` - Checkout UI extension

**Testing Steps:**

1. **Set up referral (from Feature 2):**
   - Click referral link: `https://your-store.myshopify.com/?ref=ALICE123`
   - Add product to cart
   - Verify console shows discount code applied

2. **Proceed to checkout:**
   - Go to checkout
   - Discount should appear automatically
   - Should show: "Referral Discount (10%)" or similar
   - Order total should reflect discount

3. **Check discount details:**
   - Discount code should be visible: `GACHI-ALICE123-ABC1`
   - Discount amount should match configured percentage (default: 10%)

4. **Test Checkout UI Extension:**
   - If discount not applied automatically, Checkout UI Extension should apply it
   - Look for success banner: "Referral discount applied!"
   - Check console for: `Referral discount applied from metafield: GACHI-ALICE123-ABC1`

**What to update if it fails:**
- **File:** `extensions/referral-discount-function/src/run.graphql`
  - Check metafield queries are correct (lines 10-25)
  - Check attribute fallback queries (lines 26-35)
- **File:** `extensions/referral-discount-function/src/cart_lines_discounts_generate_run.rs`
  - Check discount calculation logic (lines 40-80)
  - Check metafield/attribute reading logic (lines 20-40)
- **File:** `extensions/checkout-discount-applier/src/index.jsx`
  - Check metafield reading (lines 25-34)
  - Check `shopify.applyDiscountCode` call (lines 80-90)
- **Shopify Partners Dashboard:**
  - Verify Discount Function is deployed
  - Check discount function is enabled for your store

**Restart needed:** 
- No restart needed for extension changes
- Just redeploy: `shopify app deploy`

---

### Feature 4: Webhook Processing (Order Creation)

**What it does:** When an order is created, webhook processes it to:
- Create referral code for new customer (if they don't have one)
- Track referral conversion (if order used referral discount)
- Mark safe link as used

**Files involved:**
- `app/routes/webhooks.orders.create.jsx` - Webhook route handler
- `app/services/webhook-processor.server.js` - Business logic (lines 17-150)
- `app/services/referral.server.js` - Referral tracking functions

**Testing Steps:**

1. **Complete a purchase with referral discount:**
   - Use referral link: `https://your-store.myshopify.com/?ref=ALICE123`
   - Add product to cart
   - Complete checkout with discount applied

2. **Check server logs:**
   - Look for webhook processing logs in terminal running `npm run dev`
   - Should see: `[WEBHOOK PROCESSOR] Successfully processed webhook (orders/create)`
   - Should see: `Referral join created for order...`

3. **Verify in database:**
   ```bash
   npm run db:studio
   ```
   - Check `ReferralJoin` table:
     - Should have new record
     - `orderId` should match Shopify order ID
     - `referralCode` should be `ALICE123`
     - `discountCode` should be `GACHI-ALICE123-ABC1`
     - `orderTotal` and `discountAmount` should be populated
   - Check `ReferralSafeLink` table:
     - Safe link should be marked `used = true`
     - `usedAt` should be set
     - `orderId` should match order ID

4. **Verify customer became referrer:**
   - Check `StorefrontUser` table:
     - New customer should have record
     - Should have email and `storefrontUserId`
   - Check `ReferralDiscountCode` table:
     - New customer should have their own referral code
     - Format: `GACHI-NEWCODE123`

**What to update if it fails:**
- **File:** `.env`
  - Check `WEBHOOK_SECRET` is set (for webhook verification)
- **File:** `app/services/webhook-processor.server.js`
  - Check `processOrdersCreate` function (lines 17-150)
  - Check safe link finding logic (lines 80-120)
  - Check referral join creation (lines 120-150)
- **File:** `app/services/referral.server.js`
  - Check `createReferralJoin` function
  - Check `markSafeLinkUsed` function
- **Shopify Partners Dashboard:**
  - Verify `orders/create` webhook is configured
  - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → Webhooks
  - Check webhook URL is correct (tunnel URL when dev server running)

**Restart needed:** Yes, if you modify webhook processing code or `.env`.

---

### Feature 5: Customer-to-Referrer Conversion

**What it does:** When a customer completes a purchase (even without using a referral), they automatically become a referrer and get their own referral code.

**Files involved:**
- `app/services/webhook-processor.server.js` - Auto-creates referral code (lines 18-60)
- `app/services/referral.server.js` - `findOrCreateReferralCode` function

**Testing Steps:**

1. **Make a purchase WITHOUT referral:**
   - Go to store (no `?ref=` parameter)
   - Add product to cart
   - Complete checkout normally

2. **Check Thank You page:**
   - Should show referral link
   - Customer should have their own referral code

3. **Verify in database:**
   ```bash
   npm run db:studio
   ```
   - Check `StorefrontUser` table:
     - Customer should have record
   - Check `ReferralDiscountCode` table:
     - Customer should have their own referral code
     - Format: `GACHI-NEWCODE123`

4. **Verify in Shopify:**
   - Go to: Shopify Admin → Discounts
   - Should see discount code: `GACHI-NEWCODE123`

**What to update if it fails:**
- **File:** `app/services/webhook-processor.server.js`
  - Check auto-creation logic in `processOrdersCreate` (lines 18-60)
  - Should run for ALL customers who complete orders
- **File:** `app/services/referral.server.js`
  - Check `findOrCreateReferralCode` function (lines 33-150)
  - Should handle both new and existing customers

**Restart needed:** Yes, if you modify webhook processing code.

---

### Feature 6: Cart Metafields vs Attributes

**What it does:** System tries to use cart metafields (preferred) but falls back to cart attributes if metafields fail.

**Files involved:**
- `extensions/storefront-script/assets/applyReferral.js` - Sets metafields/attributes
- `app/routes/apps.gachi-rewards.api.set-cart-metafields.jsx` - Metafields API endpoint
- `app/services/storefront.server.js` - Storefront API client
- `extensions/referral-discount-function/src/run.graphql` - Reads metafields/attributes
- `extensions/referral-discount-function/src/cart_lines_discounts_generate_run.rs` - Uses metafields/attributes

**Testing Steps:**

1. **Test with metafields (preferred):**
   - Ensure `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set in `.env`
   - Restart dev server if you just added it
   - Click referral link: `https://your-store.myshopify.com/?ref=ALICE123`
   - Check console: Should see `(via metafields)`
   - Check Network tab: Should see `/set-cart-metafields` request succeed

2. **Test with attributes (fallback):**
   - Remove or invalidate `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in `.env`
   - Restart dev server
   - Click referral link again
   - Check console: Should see `(via attributes)`
   - System should still work

3. **Verify discount applies:**
   - Both methods should result in discount being applied at checkout
   - No difference in customer experience

**What to update if it fails:**
- **File:** `.env`
  - Check `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set correctly
- **File:** `app/services/storefront.server.js`
  - Check `getStorefrontApiClient` function
- **File:** `app/routes/apps.gachi-rewards.api.set-cart-metafields.jsx`
  - Check GraphQL mutation is correct
- **File:** `extensions/storefront-script/assets/applyReferral.js`
  - Check fallback logic (lines 100-120)
  - Check `setCartMetafields` and `storeReferralDiscountInCart` functions

**Restart needed:** Yes, if you modify `.env` or server-side code.

---

### Feature 7: Storefront Script (Referral Detection)

**What it does:** Detects `?ref=CODE` in URL and triggers referral discount application.

**Files involved:**
- `extensions/storefront-script/assets/applyReferral.js` - Main script
- `extensions/storefront-script/blocks/referral-script.liquid` - Liquid block

**Testing Steps:**

1. **Test URL detection:**
   - Visit: `https://your-store.myshopify.com/?ref=ALICE123`
   - Open browser console (F12)
   - Should see: `Referral discount applied: GACHI-ALICE123-ABC1`

2. **Test URL parameter removal:**
   - After script runs, `?ref=ALICE123` should be removed from URL
   - URL should be clean: `https://your-store.myshopify.com/`

3. **Test localStorage persistence:**
   - Check localStorage in DevTools → Application → Local Storage
   - Should have:
     - `referral_shopify_discount_code`
     - `referral_discount_percentage`
     - `referral_discount_type`

4. **Test cart update persistence:**
   - Add/remove items from cart
   - Discount should persist
   - Check console for `onCartUpdate` logs

**What to update if it fails:**
- **File:** `extensions/storefront-script/assets/applyReferral.js`
  - Check `getReferralCode` function (lines 14-18)
  - Check `applyReferral` function (lines 80-150)
  - Check `onCartUpdate` handler (lines 160-200)
- **Shopify Partners Dashboard:**
  - Verify Theme App Extension is deployed
  - Check extension is enabled in theme
  - URL: Shopify Admin → Online Store → Themes → Customize → App embeds

**Restart needed:** 
- No restart needed
- Just redeploy extension: `shopify app deploy`

---

### Feature 8: Checkout UI Extension

**What it does:** Applies discount at checkout if not already applied, handles direct checkout access with `?ref=CODE`.

**Files involved:**
- `extensions/checkout-discount-applier/src/index.jsx` - Checkout extension
- `extensions/checkout-discount-applier/shopify.extension.toml` - Extension config

**Testing Steps:**

1. **Test metafield reading:**
   - Apply referral via storefront script (Feature 2)
   - Go to checkout
   - Should see success banner: "Referral discount applied!"
   - Console should show: `Referral discount applied from metafield: GACHI-ALICE123-ABC1`

2. **Test attribute fallback:**
   - If metafields not working, should read from attributes
   - Console should show: `Referral discount applied from attribute: GACHI-ALICE123-ABC1`

3. **Test direct checkout access:**
   - Visit: `https://your-store.myshopify.com/checkout?ref=ALICE123`
   - Extension should detect `?ref=` parameter
   - Should call App Proxy to create safe link
   - Should apply discount automatically
   - Console should show: `Referral discount applied from url: GACHI-ALICE123-ABC1`

**What to update if it fails:**
- **File:** `extensions/checkout-discount-applier/src/index.jsx`
  - Check metafield reading logic (lines 25-34)
  - Check attribute fallback logic (lines 36-45)
  - Check URL parameter detection (lines 47-80)
  - Check `shopify.applyDiscountCode` call (lines 80-90)
- **File:** `extensions/checkout-discount-applier/shopify.extension.toml`
  - Verify `network_access = true` is set

**Restart needed:** 
- No restart needed
- Just redeploy extension: `shopify app deploy`

---

### Feature 9: Thank You Page Extension

**What it does:** Shows customer their referral link after purchase.

**Files involved:**
- `extensions/thank-you-referral/src/index.jsx` - Thank You extension
- `app/routes/apps.gachi-rewards.api.generate.jsx` - API endpoint

**Testing Steps:**

1. **Complete a purchase:**
   - Make a test purchase
   - Go to Thank You page

2. **Check referral link display:**
   - Should see referral link
   - Format: `https://your-store.myshopify.com/?ref=ALICE123`
   - Should be clickable/copyable

3. **Verify API call:**
   - Open DevTools → Network tab
   - Look for: `/apps/gachi-rewards/api/generate`
   - Response should include:
     - `customerReferralCode`: `ALICE123`
     - `referralLink`: Full URL
     - `shopifyDiscountCode`: `GACHI-ALICE123`

**What to update if it fails:**
- **File:** `extensions/thank-you-referral/src/index.jsx`
  - Check API call to `/apps/gachi-rewards/api/generate` (lines 28-50)
  - Check referral link display logic (lines 60-100)
- **File:** `app/routes/apps.gachi-rewards.api.generate.jsx`
  - Check App Proxy signature verification (lines 18-30)
  - Check `findOrCreateReferralCode` call (lines 60-80)
  - Check response format (lines 120-140)

**Restart needed:** 
- Yes, if you modify server-side API endpoint
- No, if you only modify extension code (just redeploy)

---

### Feature 10: App Proxy Security

**What it does:** Secures customer-facing API endpoints using Shopify App Proxy signature verification.

**Files involved:**
- `app/services/proxy.server.js` - Signature verification
- `app/routes/apps.gachi-rewards.api.*.jsx` - All App Proxy routes

**Testing Steps:**

1. **Test App Proxy endpoints:**
   - All endpoints should verify signature
   - Invalid signatures should return 401

2. **Test endpoints:**
   - `/apps/gachi-rewards/api/safe-link` - Should work with valid signature
   - `/apps/gachi-rewards/api/generate` - Should work with valid signature
   - `/apps/gachi-rewards/api/set-cart-metafields` - Should work with valid signature

**What to update if it fails:**
- **File:** `app/services/proxy.server.js`
  - Check `verifyAppProxyRequest` function
  - Check signature verification logic
- **Shopify Partners Dashboard:**
  - Verify App Proxy URL is configured correctly
  - URL: https://partners.shopify.com → Apps → Gachi Rewards → App setup → App Proxy
  - Check subpath and prefix match

**Restart needed:** Yes, if you modify proxy verification code.

---

## 📊 Database Verification

After each test, verify in database:

```bash
npm run db:studio
```

Opens at: `http://localhost:5555`

**Tables to check:**
- `StorefrontUser` - Customer records
- `ReferralDiscountCode` - Referral codes
- `ReferralSafeLink` - One-time discount links
- `ReferralJoin` - Referral conversions
- `ReferralConfig` - Shop configuration

**Important:** Close Prisma Studio (`Ctrl+C`) before running migrations or restarting dev server.

---

## 🔍 Common Issues & Fixes

### Issue: Webhooks not firing
**Fix:**
- Check webhook URL in Partners Dashboard
- Verify `WEBHOOK_SECRET` in `.env`
- Check dev server is running (webhooks need tunnel URL)
- Restart dev server if webhook URL changed

### Issue: Discount not applying
**Fix:**
- Check cart metafields/attributes are set
- Verify Discount Function is deployed: `shopify app deploy`
- Check console for errors
- Verify discount code exists in Shopify Admin → Discounts

### Issue: App Proxy returns 401
**Fix:**
- Check App Proxy URL in Partners Dashboard
- Verify signature verification in `proxy.server.js`
- Check `SHOPIFY_API_SECRET` in `.env`
- Restart dev server after changing `.env`

### Issue: Metafields not working
**Fix:**
- Check `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in `.env`
- Verify scopes are enabled: `read_cart`, `write_cart`
- Check Storefront API client in `storefront.server.js`
- Restart dev server after changing `.env`

### Issue: Extensions not updating
**Fix:**
- Run `shopify app deploy` after modifying extension code
- Check extension is enabled in theme settings
- Clear browser cache
- Wait 1-2 minutes for deployment to complete

### Issue: Hot-reload not working
**Fix:**
- Check if file is in watched directory (`app/`, `extensions/`)
- Restart dev server if needed
- Check for syntax errors in terminal

---

## ✅ Complete Testing Checklist

- [ ] Feature 1: Referral code generation works
- [ ] Feature 2: Safe link creation works
- [ ] Feature 3: Discount applies at checkout
- [ ] Feature 4: Webhook processes orders correctly
- [ ] Feature 5: Customers become referrers automatically
- [ ] Feature 6: Metafields work (with fallback to attributes)
- [ ] Feature 7: Storefront script detects referral codes
- [ ] Feature 8: Checkout UI extension works
- [ ] Feature 9: Thank You page shows referral link
- [ ] Feature 10: App Proxy security works

---

## 📝 Development Workflow Summary

### Starting Development Session

1. **Start dev server:**
   ```bash
   npm run dev
   ```
   Keep this terminal open.

2. **Deploy extensions (if needed):**
   ```bash
   shopify app deploy
   ```
   Run in new terminal.

3. **Open database browser (optional):**
   ```bash
   npm run db:studio
   ```
   Run in new terminal. Close before migrations.

### Making Code Changes

**For server-side code (`app/` directory):**
- Most changes hot-reload automatically
- Restart dev server if hot-reload doesn't work

**For extension code (`extensions/` directory):**
- Changes require redeployment: `shopify app deploy`
- No dev server restart needed

**For environment variables (`.env`):**
- Always restart dev server after changes

**For database schema (`prisma/schema.prisma`):**
- Run `npm run db:generate`
- Run `npm run db:migrate`
- Restart dev server

### Ending Development Session

1. **Stop dev server:**
   - Press `Ctrl+C` in terminal running `npm run dev`

2. **Close Prisma Studio (if open):**
   - Press `Ctrl+C` in terminal running `npm run db:studio`

3. **Close terminals:**
   - All terminals can be closed

---

## 🆘 Need Help?

- Check server logs in terminal running `npm run dev`
- Use `npm run db:studio` to inspect database
- Check browser console for client-side errors
- Verify all environment variables are set correctly
- Check Shopify Partners Dashboard for configuration
- Review troubleshooting section above

---

## 📚 Related Documentation

- **[QUICK-START.md](./QUICK-START.md)** - Initial setup guide
- **[STOREFRONT-API-SETUP.md](./STOREFRONT-API-SETUP.md)** - Storefront API configuration
- **[MIGRATION-SUMMARY.md](./MIGRATION-SUMMARY.md)** - Cart metafields migration details
