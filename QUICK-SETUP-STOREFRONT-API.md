# Quick Setup: Storefront API Access Token

## 🚀 Fast Track (5 minutes)

### Step 1: Get Token from Shopify Partners

1. Go to: **https://partners.shopify.com**
2. Click **"Apps"** → **"Gachi Rewards"**
3. Click **"App setup"** (left sidebar)
4. Scroll to **"API credentials"** section
5. Find **"Storefront API"** → Click **"Configure"**
6. Enable scopes:
   - ✅ `read_cart`
   - ✅ `write_cart`
7. Click **"Save"**
8. **Copy the Storefront API access token**

### Step 2: Add to Local .env

Add this line to your `.env` file:
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=paste_your_token_here
```

### Step 3: Test

Visit: `your-store.myshopify.com/products/item?ref=ALICE123`

Check browser console for:
```
Referral discount applied: GACHI-ALICE123-ABC1 (via metafields)
```

✅ If you see "(via metafields)" - You're all set!
⚠️ If you see "(via attributes)" - Check token is set correctly

---

## 📚 Full Guide

See `STOREFRONT-API-SETUP.md` for detailed instructions and troubleshooting.
