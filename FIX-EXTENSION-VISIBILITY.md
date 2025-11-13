# Fix: Extension Not Appearing in Checkout Settings

## The Issue

The `thank-you-referral` extension uses target `purchase.thank-you.block.render`, which is for the **Order Status Page** (Customer Accounts), not the Checkout Thank You page.

## Solution: Deploy the Extension

The extension must be **deployed** before it appears in settings. Run this in your terminal (not through me):

```bash
shopify app deploy
```

**Important:** This command must be run interactively in your terminal - it will ask for confirmation.

## After Deployment

1. **Go to Shopify Admin** → **Settings** → **Customer accounts** (not Checkout!)
2. Look for **"Order status page extensions"** or **"Checkout extensions"**
3. Find **"thank-you-referral"**
4. **Enable it**

## Alternative: Check Partners Dashboard

1. Go to **Shopify Partners Dashboard**: https://partners.shopify.com
2. Click your app → **"Extensions"** tab
3. Check if `thank-you-referral` is listed and its status

## If It Still Doesn't Appear

### Check 1: App Installation
- Make sure the app is **installed** in your development store
- Go to **Apps** → **Develop apps** in your store admin
- Install "Gachi Rewards" if not installed

### Check 2: Extension Target
The target `purchase.thank-you.block.render` is correct for Order Status Page. If you want it on the Checkout Thank You page instead, we'd need to change the target.

### Check 3: Deploy Status
After running `shopify app deploy`, check for:
- ✅ "Deployed extensions successfully"
- ❌ Any error messages

## Quick Checklist

- [ ] Extension dependencies installed: `cd extensions/thank-you-referral && npm install`
- [ ] Extension deployed: `shopify app deploy` (run in your terminal)
- [ ] App installed in development store
- [ ] Check **Settings → Customer accounts** (not Checkout) for the extension
- [ ] Extension enabled/toggled ON

---

**The extension will only appear in settings AFTER it's been deployed.**

