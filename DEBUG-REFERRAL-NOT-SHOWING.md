# Debug: Referral Code Not Showing on Thank You Page

Step-by-step debugging guide to find why the referral code isn't appearing.

---

## 🔍 Step 1: Check Browser Console

**On the Thank You page:**

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for these messages:**

### What to Look For:

**✅ Good signs:**
- `"Fetching referral link from: /apps/gachi-rewards/api/generate?..."` 
- `"Referral API response: {success: true, referralLink: '...'}"`

**❌ Error signs:**
- `"API error: 401"` → App Proxy signature issue
- `"API error: 404"` → Route not found
- `"API error: 500"` → Server error
- `"Failed to load referral link: ..."` → Network/API error
- `"Order information not available"` → Missing order/customer data

**📝 Copy any error messages you see**

---

## 🔍 Step 2: Check Network Tab

**In DevTools:**

1. **Go to Network tab**
2. **Reload the Thank You page** (or make a new purchase)
3. **Look for request to:**
   ```
   /apps/gachi-rewards/api/generate
   ```

### Check the Request:

1. **Click on the request**
2. **Check Request URL:**
   - Should be: `https://oolong-test.myshopify.com/apps/gachi-rewards/api/generate?...`
   - Should have query params: `orderId`, `customerId`, `customerEmail`, `shop`, `timestamp`, `signature`

3. **Check Response:**
   - **Status:** Should be `200` (not 401, 404, or 500)
   - **Response body:** Click "Response" tab
   - Should see: `{"success": true, "referralLink": "...", ...}`

### Common Issues:

- **Status 401:** App Proxy signature invalid
- **Status 404:** Route not found (App Proxy not configured)
- **Status 500:** Server error (check terminal logs)
- **CORS error:** App Proxy configuration issue

---

## 🔍 Step 3: Check Terminal Logs

**In the terminal where `npm run dev` is running:**

Look for:

### API Request Logs:
```
GET /apps/gachi-rewards/api/generate
```

### Error Messages:
- `"Invalid App Proxy signature"` → App Proxy config issue
- `"Customer ID, email, or order ID required"` → Missing customer data
- `"Error generating referral:"` → Database or API error
- `"Failed to create discount:"` → Discount creation issue (non-critical)

**📝 Copy any error messages you see**

---

## 🔍 Step 4: Check Extension Settings

**In Checkout Editor:**

1. **Go to Checkout Editor** (Settings → Checkout → Customize)
2. **Find the thank-you-referral block**
3. **Check settings:**
   - **API URL:** Should be `/apps/gachi-rewards/api/generate`
   - **Title:** Can be anything

---

## 🔍 Step 5: Test API Directly

**Test if the API works by visiting this URL in your browser:**

```
https://oolong-test.myshopify.com/apps/gachi-rewards/api/generate?orderId=test123&customerEmail=test@example.com&shop=oolong-test.myshopify.com
```

**Expected response:**
```json
{
  "success": true,
  "referralCode": "ABC123",
  "referralLink": "https://oolong-test.myshopify.com/?ref=ABC123",
  "discountCode": "GACHI-ABC123"
}
```

**If you get an error:**
- **401:** App Proxy signature issue
- **404:** App Proxy not configured
- **500:** Server error

---

## 🔍 Step 6: Verify App Proxy Configuration

**In Shopify Partners Dashboard:**

1. Go to **Partners Dashboard** → Your App → **App setup**
2. **App Proxy section:**
   - **Subpath prefix:** `apps`
   - **Subpath:** `gachi-rewards`
   - **Proxy URL:** `https://payments-used-hunt-response.trycloudflare.com/apps/gachi-rewards`

3. **Verify:**
   - Proxy URL is correct
   - Subpath matches configuration
   - App Proxy is enabled

---

## 🔍 Step 7: Check Extension Code

**The extension should show:**

1. **Loading state:** "Generating your referral link..."
2. **Error state:** "Referral link will be available soon." (if error)
3. **Success state:** Referral link with copy button

**If you see nothing:**
- Extension might be hidden (returns `null`)
- Check console for errors
- Extension might not be enabled

---

## 🐛 Common Issues & Fixes

### Issue 1: "Invalid request signature" (401)

**Cause:** App Proxy signature verification failing

**Fix:**
1. Verify `SHOPIFY_API_SECRET` in `.env` matches your app secret
2. Check App Proxy URL in Partners Dashboard
3. Make sure Proxy URL ends with `/apps/gachi-rewards`

### Issue 2: "404 Not Found"

**Cause:** App Proxy not configured or route not found

**Fix:**
1. Verify App Proxy is configured in Partners Dashboard
2. Check Proxy URL is correct
3. Verify route exists: `app/routes/apps.gachi-rewards.api.generate.jsx`

### Issue 3: "Order information not available"

**Cause:** Extension can't get order/customer data

**Fix:**
1. Make sure you're on the Thank You page (not Order Status page)
2. Check if customer is logged in
3. Try with a logged-in customer account

### Issue 4: Extension shows "Referral link will be available soon"

**Cause:** API call failed or returned error

**Fix:**
1. Check browser console for the actual error
2. Check Network tab for API response
3. Check terminal logs for server errors

### Issue 5: Extension doesn't appear at all

**Cause:** Extension not enabled or hidden

**Fix:**
1. Check extension is enabled in Checkout Editor
2. Check browser console for JavaScript errors
3. Verify extension is deployed

---

## 📋 Quick Debug Checklist

Run through this checklist:

- [ ] Browser console shows API request
- [ ] Network tab shows request to `/apps/gachi-rewards/api/generate`
- [ ] API response status is 200 (not 401/404/500)
- [ ] API response has `success: true` and `referralLink`
- [ ] Terminal shows API request received
- [ ] No errors in terminal logs
- [ ] App Proxy is configured correctly
- [ ] Extension is enabled in Checkout Editor
- [ ] API URL in extension settings is correct

---

## 🎯 What to Share for Help

If you need help, share:

1. **Browser console errors** (screenshot or copy text)
2. **Network tab response** (status code and response body)
3. **Terminal error logs** (from `npm run dev`)
4. **What you see on the page** (loading, error message, or nothing)
5. **API URL from extension settings**

---

## 💡 Quick Test

**Test the API directly:**

1. Make a test purchase
2. On Thank You page, open browser console (F12)
3. Run this in console:
   ```javascript
   fetch('/apps/gachi-rewards/api/generate?orderId=test&customerEmail=test@example.com&shop=oolong-test.myshopify.com')
     .then(r => r.json())
     .then(console.log)
   ```
4. Check what response you get

This will tell you if the API is working at all.

---

**Start with Step 1 (Browser Console) and work through each step. Share what you find!**

