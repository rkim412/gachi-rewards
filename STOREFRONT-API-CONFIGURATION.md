# Storefront API Configuration - Complete Guide

## ✅ Current Status

**Your system does NOT currently have a Storefront API access token configured.**

Your app currently uses:
- ✅ Admin API (via `authenticate.admin`) - Configured
- ✅ App Proxy - Configured  
- ❌ Storefront API - **Not configured** (needs setup)

---

## 🎯 Why You Need This

The Storefront API access token is required for:
- Setting cart metafields (Phase 1-3 of migration)
- More reliable than cart attributes
- Better security (server-side control)
- Checkout UI Extension compatibility

**Without it:** System falls back to cart attributes (works, but not optimal)

---

## 📋 Configuration Steps

### Option 1: Quick Setup (5 minutes)

Follow `QUICK-SETUP-STOREFRONT-API.md` for fastest setup.

### Option 2: Detailed Setup

Follow `STOREFRONT-API-SETUP.md` for step-by-step instructions with troubleshooting.

---

## 🔍 How to Get Your Token

### Step-by-Step:

1. **Go to Shopify Partners Dashboard:**
   - URL: https://partners.shopify.com
   - Sign in with your Partners account

2. **Navigate to Your App:**
   - Click **"Apps"** in left sidebar
   - Find and click **"Gachi Rewards"**
   - Your Client ID: `f232a78339525e79f08b9bcec3b61b8f`

3. **Go to API Credentials:**
   - Click **"App setup"** (left sidebar)
   - Scroll down to **"API credentials"** section
   - You'll see:
     - **Client credentials** (Admin API) - ✅ Already configured
     - **Storefront API** - ⚠️ Needs configuration

4. **Configure Storefront API:**
   - Click **"Configure"** or **"Enable"** next to Storefront API
   - You'll see a form with scope checkboxes

5. **Enable Required Scopes:**
   Check these boxes:
   - ✅ **`read_cart`** - Read cart data and metafields
   - ✅ **`write_cart`** - Write cart metafields

6. **Save Configuration:**
   - Click **"Save"** or **"Update"**
   - After saving, the **Storefront API access token** will appear

7. **Copy the Token:**
   - Click the **"Copy"** button or manually copy
   - Token format: Usually starts with `shpat_` or similar
   - ⚠️ **This is different from your Admin API token!**

---

## 💾 Where to Add the Token

### Local Development (.env file)

1. Open or create `.env` file in project root
2. Add this line:
   ```bash
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
   ```
3. Replace `your_token_here` with the token you copied
4. Save the file
5. Restart your dev server: `npm run dev`

---

## 🧪 Testing Your Configuration

### Method 1: Test Script

Run the test script:
```bash
npm run test:storefront-api your-store.myshopify.com
```

This will:
- ✅ Verify token is set
- ✅ Test Storefront API connection
- ✅ Verify scopes are correct
- ✅ Test cart metafields mutation syntax

### Method 2: Manual Test

1. Visit your storefront with referral link:
   ```
   https://your-store.myshopify.com/products/item?ref=ALICE123
   ```

2. Open browser console (F12)

3. Look for log message:
   ```
   Referral discount applied: GACHI-ALICE123-ABC1 (via metafields)
   ```

4. **Results:**
   - ✅ **"(via metafields)"** = Token is working!
   - ⚠️ **"(via attributes)"** = Token not set or incorrect (fallback working)

### Method 3: Check Network Tab

1. Open browser DevTools → Network tab
2. Visit storefront with `?ref=ALICE123`
3. Look for request to:
   ```
   /apps/gachi-rewards/api/set-cart-metafields
   ```
4. Check response:
   - ✅ `{ success: true }` = Metafields working
   - ❌ Error response = Check token configuration

---

## 🔧 Troubleshooting

### "No Storefront API access token found"

**Cause:** Token not set in environment variables

**Fix:**
1. Check `.env` file has the token
2. Verify variable name is exactly: `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
3. No extra spaces or quotes
4. Restart dev server after adding to `.env`

### "Storefront API request failed: 401 Unauthorized"

**Cause:** Invalid or expired token

**Fix:**
1. Verify token is correct (copy again from Partners Dashboard)
2. Check token hasn't been regenerated
3. Ensure you're using **Storefront API** token, not Admin API token
4. Verify scopes are enabled: `read_cart`, `write_cart`

### "Storefront API request failed: 403 Forbidden"

**Cause:** Missing required scopes

**Fix:**
1. Go to Partners Dashboard → App setup → API credentials
2. Click **"Configure"** on Storefront API
3. Enable scopes: `read_cart`, `write_cart`
4. Save and regenerate token if needed

---

## 📊 Expected Behavior

### With Token Configured:
- ✅ Storefront script sets cart metafields
- ✅ Console shows: "(via metafields)"
- ✅ Discount Function reads from metafields
- ✅ Checkout UI Extension reads from metafields
- ✅ Better reliability and security

### Without Token (Fallback):
- ⚠️ Storefront script uses cart attributes
- ⚠️ Console shows: "(via attributes)"
- ✅ Discount Function reads from attributes
- ✅ Checkout UI Extension reads from attributes
- ✅ System still works, but less optimal

**Both methods work!** Metafields are preferred, but attributes are a reliable fallback.

---

## ✅ Verification Checklist

After configuration, verify:

- [ ] Token copied from Partners Dashboard
- [ ] Token added to `.env` file
- [ ] Scopes enabled: `read_cart`, `write_cart`
- [ ] Test script passes: `npm run test:storefront-api`
- [ ] Browser console shows "(via metafields)"
- [ ] Network tab shows successful `/set-cart-metafields` call
- [ ] Discount applies correctly at checkout

---

## 📚 Files Created

I've created these helpful files:

1. **`STOREFRONT-API-SETUP.md`** - Detailed step-by-step guide
2. **`QUICK-SETUP-STOREFRONT-API.md`** - Fast 5-minute setup
3. **`scripts/test-storefront-api.js`** - Test script to verify configuration
4. **Updated `.env copy.example`** - Includes token variable

---

## 🚀 Next Steps

1. **Get the token** (follow steps above)
2. **Add to `.env` file**
3. **Test** using `npm run test:storefront-api`
4. **Verify** with a real referral link
5. **Monitor** logs for metafield success rate

---

## 💡 Pro Tips

1. **Token Security:**
   - Never commit `.env` to git (should be in `.gitignore`)
   - Store securely
   - Regenerate if compromised

2. **Testing:**
   - Test with both metafields and attributes
   - Verify fallback works if token is missing

3. **Monitoring:**
   - Check server logs for "(via metafields)" vs "(via attributes)"
   - Target: >95% metafield success rate

4. **Multiple Shops:**
   - One Storefront API token works for all shops
   - If you need per-shop tokens, we can implement that later

---

## 🆘 Still Need Help?

If you're stuck:
1. Check `STOREFRONT-API-SETUP.md` for detailed troubleshooting
2. Run `npm run test:storefront-api` to diagnose issues
3. Check server logs for specific error messages
4. Verify token in Partners Dashboard hasn't changed
