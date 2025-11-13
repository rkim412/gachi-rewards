# How to Enable Thank You Referral Extension

If the "thank-you-referral" extension doesn't appear in Checkout settings, follow these steps:

---

## Step 1: Deploy the Extension

**First, make sure the extension is deployed:**

```bash
# Deploy all extensions
shopify app deploy

# Or deploy just the thank-you extension
shopify app deploy --only=thank-you-referral
```

**Wait for deployment to complete** (you should see "✓ Deployed extensions successfully")

---

## Step 2: Verify App is Installed

1. Go to your **Shopify Admin**
2. Navigate to **Apps** → **Develop apps** (or **App and sales channel settings**)
3. Find **"Gachi Rewards"** in the list
4. Make sure it shows as **"Installed"** or **"Enabled"**
5. If not installed, click **"Install"** or **"Enable"**

---

## Step 3: Enable Extension in Checkout Settings

**Option A: Checkout Extensions (Standard Checkout)**

1. Go to **Settings** → **Checkout**
2. Scroll down to **Checkout extensions** section
3. Look for **"thank-you-referral"** or **"Thank You Referral"**
4. **Toggle it ON** (enable it)
5. Click **"Save"** at the bottom

**Option B: Customer Accounts (Order Status Page)**

If the extension doesn't appear in Checkout settings, it might be in Customer Accounts:

1. Go to **Settings** → **Customer accounts**
2. Look for **"Checkout extensions"** or **"Order status page extensions"**
3. Find **"thank-you-referral"**
4. **Enable it**

**Option C: App Settings**

Some extensions are enabled through the app itself:

1. Go to **Apps** → **Gachi Rewards**
2. Look for extension settings or configuration
3. Enable the Thank You extension

---

## Step 4: Verify Extension is Active

After enabling, test it:

1. Make a test purchase
2. Complete checkout
3. On the **Thank You page**, you should see:
   - "Generating your referral link..." (loading state)
   - Then the referral link with "Copy Referral Link" button

---

## Troubleshooting: Extension Still Not Showing

### Check 1: Extension Deployment Status

```bash
# Check if extension is deployed
shopify app info
```

You should see:
```
ui_extension
📂 thank-you-referral         extensions/thank-you-referral
     config file              shopify.extension.toml
```

### Check 2: App Installation Status

1. Go to **Shopify Partners Dashboard**: https://partners.shopify.com
2. Click on your app → **"Test on development store"**
3. Make sure the app is installed in your development store

### Check 3: Extension Configuration

Verify the extension configuration file is correct:

**File:** `extensions/thank-you-referral/shopify.extension.toml`

Should contain:
```toml
type = "ui_extension"
name = "thank-you-referral"
handle = "thank-you-referral"

[[extensions.targeting]]
target = "purchase.thank-you.block.render"
module = "./src/index.jsx"
```

### Check 4: Redeploy Extension

If the extension still doesn't appear, try redeploying:

```bash
# Stop dev server (Ctrl+C)
# Then deploy
shopify app deploy --reset

# Or deploy specific extension
shopify app deploy --only=thank-you-referral --reset
```

### Check 5: Check Extension Dependencies

Make sure extension dependencies are installed:

```bash
cd extensions/thank-you-referral
npm install
cd ../..
```

Then redeploy:
```bash
shopify app deploy
```

---

## Alternative: Check Extension in Partners Dashboard

1. Go to **Shopify Partners Dashboard**: https://partners.shopify.com
2. Click on your **"Gachi Rewards"** app
3. Go to **"Extensions"** tab
4. You should see **"thank-you-referral"** listed
5. Check its status - should be **"Active"** or **"Published"**

---

## Still Not Working?

If the extension still doesn't appear:

1. **Check terminal logs** when running `shopify app deploy` for errors
2. **Verify extension target** is correct: `purchase.thank-you.block.render`
3. **Check Shopify CLI version**: `shopify version` (should be 3.87.2 or newer)
4. **Try creating a new extension** to test if the issue is with this specific extension

---

## Quick Test

After enabling, make a test purchase and check:

1. **Browser Console** (F12) - Should see:
   - `"Fetching referral link from: ..."`
   - `"Referral API response: ..."`

2. **Thank You Page** - Should see:
   - Referral link display
   - "Copy Referral Link" button

3. **Database** (`npm run db:studio`) - Should see:
   - `StorefrontUser` record
   - `ReferralDiscountCode` record

---

**The extension should appear in Settings → Checkout → Checkout extensions after deployment and app installation.**

