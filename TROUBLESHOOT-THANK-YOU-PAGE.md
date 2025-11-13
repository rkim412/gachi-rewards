# Troubleshooting: Referral Code Not Appearing on Thank You Page

## Quick Fixes

### 1. Verify Extension is Enabled

**In Shopify Admin:**
1. Go to **Settings** → **Checkout**
2. Scroll down to **Checkout extensions**
3. Find **"thank-you-referral"**
4. Make sure it's **enabled** (toggle should be ON)
5. Click **Save**

### 2. Check Browser Console

**On the Thank You page:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for:
   - `"Fetching referral link from: ..."` - Should show the API URL
   - `"Referral API response: ..."` - Should show the response
   - Any **red error messages**

**Common errors:**
- `"Invalid request signature"` → App Proxy not configured correctly
- `"Customer ID required"` → Guest checkout issue (should be fixed now)
- `"Failed to load referral link"` → Network/API error

### 3. Verify App Proxy Configuration

**In Shopify Partners Dashboard:**
1. Go to your app → **App setup**
2. Scroll to **App Proxy** section
3. Verify:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: Should match your app URL + `/apps/gachi-rewards`

### 4. Check Extension Deployment

Make sure the extension is deployed:

```bash
# Deploy extensions
shopify app deploy

# Or deploy just the thank-you extension
shopify app deploy --only=thank-you-referral
```

### 5. Test the API Endpoint Directly

Test if the API works by visiting (replace with your store domain):

```
https://yourstore.myshopify.com/apps/gachi-rewards/api/generate?orderId=test&customerEmail=test@example.com&shop=yourstore.myshopify.com
```

**Expected response:**
```json
{
  "success": true,
  "referralCode": "ABC123",
  "referralLink": "https://yourstore.myshopify.com/?ref=ABC123",
  "discountCode": "GACHI-ABC123"
}
```

---

## Common Issues & Solutions

### Issue: Extension Not Visible at All

**Solution:**
1. Check extension is enabled in Checkout settings
2. Verify extension is deployed: `shopify app deploy`
3. Clear browser cache and reload
4. Try a different browser/incognito mode

### Issue: "Loading..." Message Stays Forever

**Possible causes:**
- API endpoint not responding
- App Proxy not configured
- Network error

**Solution:**
1. Check browser console for errors
2. Verify App Proxy URL in Partners Dashboard
3. Check if dev server is running (`npm run dev`)
4. Test API endpoint directly (see above)

### Issue: "Customer information not available"

**Solution:**
- This should be fixed now - the extension handles guest checkouts
- If still seeing this, check browser console for the actual error

### Issue: "Invalid request signature"

**Solution:**
1. Verify `SHOPIFY_API_SECRET` in `.env` matches your app secret
2. Check App Proxy configuration in Partners Dashboard
3. Make sure the proxy URL is correct

### Issue: Extension Shows Error Message

**Check:**
1. Browser console for detailed error
2. Terminal where `npm run dev` is running for server errors
3. Database connection (run `npm run db:studio` to verify)

---

## Step-by-Step Debugging

### Step 1: Check Extension is Loaded

1. Go to Thank You page after checkout
2. Open DevTools → **Network** tab
3. Look for request to `/apps/gachi-rewards/api/generate`
4. Check if request is made and what the response is

### Step 2: Check API Response

1. In Network tab, click on the `/api/generate` request
2. Check **Response** tab
3. Should see JSON with `success: true` and `referralLink`

### Step 3: Check Console Logs

1. In Console tab, look for:
   - `"Fetching referral link from: ..."`
   - `"Referral API response: ..."`
   - Any error messages

### Step 4: Verify Database

1. Run `npm run db:studio`
2. Check `StorefrontUser` table - should have a record for the customer
3. Check `ReferralDiscountCode` table - should have a referral code

---

## Testing Checklist

- [ ] Extension is enabled in Checkout settings
- [ ] Extension is deployed (`shopify app deploy`)
- [ ] App Proxy is configured correctly
- [ ] Browser console shows API request
- [ ] API returns `success: true`
- [ ] Database has customer record
- [ ] Database has referral code record

---

## Still Not Working?

1. **Check terminal logs** where `npm run dev` is running
2. **Check browser console** for JavaScript errors
3. **Verify extension code** is up to date (recently fixed)
4. **Try redeploying** the extension
5. **Test with a logged-in customer** (not guest checkout)

---

## Recent Fixes Applied

✅ **Fixed:** Admin authentication no longer required (App Proxy handles auth)
✅ **Fixed:** Guest checkout support (works without customer.id)
✅ **Fixed:** Better error handling and logging
✅ **Fixed:** Extension shows helpful messages instead of failing silently

---

**If issues persist, check the browser console and terminal logs for specific error messages.**

