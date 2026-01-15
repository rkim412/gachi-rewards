# Storefront API Access Token Setup Guide

## 🎯 Overview

This guide will help you configure the Storefront API access token for your Gachi Rewards app. This token is required for setting cart metafields (Phase 1-3 of the migration).

---

## 📋 Step-by-Step Instructions

### Step 1: Access Shopify Partners Dashboard

1. Go to: **https://partners.shopify.com**
2. Sign in with your Shopify Partners account
3. Navigate to: **Apps** → Find **"Gachi Rewards"** (or click on it)

### Step 2: Navigate to API Credentials

1. In your app dashboard, click **"App setup"** (left sidebar)
2. Scroll down to **"API credentials"** section
3. You should see:
   - **Client credentials** (Admin API) - Already configured ✅
   - **Storefront API** - Needs configuration ⚠️

### Step 3: Configure Storefront API

1. In the **"API credentials"** section, find **"Storefront API"**
2. Click **"Configure"** or **"Enable"** button
3. You'll see a form to configure Storefront API scopes

### Step 4: Enable Required Scopes

Enable these scopes (check the boxes):

- ✅ **`read_cart`** - Required to read cart metafields
- ✅ **`write_cart`** - Required to set cart metafields

**Optional but recommended:**
- `read_products` - If you plan to use Storefront API for product data
- `read_customer_tags` - If you need customer tag information

### Step 5: Save and Get Access Token

1. Click **"Save"** or **"Update"**
2. After saving, you'll see:
   - **Storefront API access token** (a long string)
   - Format: Usually starts with `shpat_` or similar
3. **Copy this token** - You'll need it in the next step

**⚠️ Important:** 
- This token is different from your Admin API token
- Store it securely
- You can regenerate it if needed (but will need to update environment variables)

---

## 🔧 Step 6: Add Token to Environment Variables

### For Local Development (.env file)

1. Open your `.env` file (or create one if it doesn't exist)
2. Add this line:
   ```bash
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token_here
   ```
3. Replace `your_storefront_token_here` with the token you copied
4. Save the file

**Example:**
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

## ✅ Step 6: Verify Configuration

### Test Locally

1. Make sure your `.env` file has the token
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Visit your storefront with a referral link:
   ```
   https://your-store.myshopify.com/products/item?ref=ALICE123
   ```
4. Open browser console (F12)
5. Check for log message:
   ```
   Referral discount applied: GACHI-ALICE123-ABC1 (via metafields)
   ```
   - ✅ If you see "(via metafields)" - Token is working!
   - ⚠️ If you see "(via attributes)" - Token may not be set correctly

---

## 🔍 Troubleshooting

### Issue: "No Storefront API access token found"

**Symptoms:**
- Error in server logs
- Console shows "(via attributes)" always

**Solutions:**
1. Verify token is in `.env` file
2. Check token doesn't have extra spaces or quotes
3. Restart dev server after adding to `.env`

### Issue: "Storefront API request failed: 401 Unauthorized"

**Symptoms:**
- 401 error in server logs
- Metafields not being set

**Solutions:**
1. Verify token is correct (copy again from Partners Dashboard)
2. Check token hasn't been regenerated/revoked
3. Verify scopes are enabled: `read_cart`, `write_cart`
4. Make sure you're using the **Storefront API** token, not Admin API token

### Issue: "Storefront API request failed: 403 Forbidden"

**Symptoms:**
- 403 error in server logs

**Solutions:**
1. Verify scopes are enabled in Partners Dashboard
2. Check that `read_cart` and `write_cart` are both enabled
3. Try regenerating the token


---

## 📝 Quick Reference

### Your App Details
- **App Name:** Gachi Rewards
- **Client ID:** `f232a78339525e79f08b9bcec3b61b8f`
- **Partners Dashboard:** https://partners.shopify.com → Apps → Gachi Rewards

### Required Scopes
- `read_cart` ✅
- `write_cart` ✅

### Environment Variable
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
```

### Where to Add
- **Local:** `.env` file in project root

---

## 🎯 Next Steps

After configuring the token:

1. ✅ Test locally (see Step 6)
2. ✅ Monitor logs for metafield success rate
3. ✅ Verify discounts are applying correctly

---

## 💡 Pro Tips

1. **Token Security:**
   - Never commit `.env` file to git
   - Store token securely
   - Regenerate if compromised

2. **Testing:**
   - Test with both metafields and attributes fallback
   - Verify system works even if token is missing (fallback)

3. **Monitoring:**
   - Check server logs for metafield vs attribute usage
   - Target: >95% metafield success rate

4. **Multiple Shops:**
   - Currently, one token works for all shops
   - If you need per-shop tokens, we can implement that later

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify token in Partners Dashboard
3. Check server logs for specific error messages
4. Test with attributes fallback (should always work)
