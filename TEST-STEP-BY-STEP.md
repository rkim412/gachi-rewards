# Step-by-Step Testing Guide for Gachi Rewards

Complete instructions to test the referral system end-to-end in your Shopify development store.

---

## ✅ Prerequisites Checklist

Before starting, verify:

- [ ] Dev server is running (`npm run dev`)
- [ ] Extension is enabled in Checkout Editor (block settings)
- [ ] API URL is set to: `/apps/gachi-rewards/api/generate`
- [ ] App Proxy is configured correctly in Partners Dashboard
- [ ] Database is ready (optional: `npm run db:studio` to verify)

---

## 🧪 Test Scenario: Full Referral Loop

We'll test:
1. **Customer A** makes a purchase → Gets referral code
2. **Customer B** uses referral link → Gets discount
3. **Customer B** completes purchase → Referral tracked

---

## Step 1: Open Database Viewer (Optional but Recommended)

**In a separate terminal:**

```bash
npm run db:studio
```

This opens Prisma Studio so you can watch database changes in real-time.

**Keep this open** - you'll check it after each step.

---

## Step 2: Make First Purchase (Customer A)

### 2.1 Start Test Purchase

1. **Open your storefront** in a browser:
   ```
   https://oolong-test.myshopify.com
   ```

2. **Add a product to cart**

3. **Go to checkout**

4. **Create a customer account** (important!):
   - Email: `alice@test.com`
   - Fill in shipping/billing info
   - Complete checkout

### 2.2 Verify Referral Code on Thank You Page

**After checkout completes:**

1. **Look for the Thank You page**
   - Should show order confirmation

2. **Look for the referral extension block:**
   - Should see: "Generating your referral link..."
   - Then: "🎉 Share your link and give friends 10% off!"
   - Should show a referral link like: `https://oolong-test.myshopify.com/?ref=ALICE123`
   - Should have a "Copy Referral Link" button

3. **Copy the referral link** (you'll need it in Step 3)

4. **Open browser DevTools** (F12) → **Console tab**
   - Look for: `"Fetching referral link from: /apps/gachi-rewards/api/generate"`
   - Look for: `"Referral API response: {success: true, ...}"`

### 2.3 Verify in Database

**In Prisma Studio (or check via terminal):**

1. **Check `StorefrontUser` table:**
   - Should have 1 record
   - `email` = `alice@test.com`
   - Note the `id` and `storefrontUserId`

2. **Check `ReferralDiscountCode` table:**
   - Should have 1 record
   - `referralCode` = something like `ALICE123`
   - `discountCode` = `GACHI-ALICE123`
   - Linked to the StorefrontUser

✅ **Step 2 Complete:** Customer A has a referral code!

---

## Step 3: Use Referral Link (Customer B)

### 3.1 Open Referral Link

1. **Open a new incognito/private browser window** (to simulate a different customer)

2. **Paste the referral link** from Step 2.2:
   ```
   https://oolong-test.myshopify.com/?ref=ALICE123
   ```
   (Replace `ALICE123` with the actual code you got)

### 3.2 Verify Discount is Applied

1. **Open browser DevTools** (F12)

2. **Go to Console tab**

3. **Look for log message:**
   ```
   Referral applied: GACHI-ALICE123
   ```
   (Should appear when page loads)

4. **Add a product to cart**

5. **Go to checkout**

6. **Verify discount is automatically applied:**
   - Look at order summary
   - Should show discount (e.g., "10% off" or discount amount)
   - Discount code should be applied automatically
   - Should see discount in the order total

### 3.3 Complete Purchase as Customer B

1. **Create a different customer account:**
   - Email: `bob@test.com` (different from Customer A!)
   - Fill in shipping/billing info
   - Complete checkout

### 3.4 Verify Referral Tracking

**In Prisma Studio:**

1. **Check `ReferralJoin` table:**
   - Should have 1 new record
   - `refereeEmail` = `bob@test.com`
   - `referralCodeId` = links to Alice's referral code
   - `discountCode` = `GACHI-ALICE123`
   - `status` = `pending`
   - `orderId` = Shopify order ID

2. **Check `ReferralSafeLink` table:**
   - Should have 1+ records
   - One should have `used` = `true`
   - `usedByOrderId` = Bob's order ID

3. **Check `StorefrontUser` table:**
   - Should now have 2 records (Alice and Bob)

✅ **Step 3 Complete:** Referral tracked successfully!

---

## Step 4: Verify Customer B Gets Their Own Referral Code

### 4.1 Check Thank You Page for Customer B

**After Customer B's checkout:**

1. **On the Thank You page**, look for:
   - "Generating your referral link..."
   - Then Bob's own referral link (e.g., `?ref=BOB456`)

2. **Copy Bob's referral link** (for future testing)

### 4.2 Verify in Database

**In Prisma Studio:**

1. **Check `ReferralDiscountCode` table:**
   - Should now have 2 records
   - One for Alice (`ALICE123`)
   - One for Bob (`BOB456`)

2. **Check `StorefrontUser` table:**
   - Should have 2 records
   - Both should have referral codes

✅ **Step 4 Complete:** Customer B has their own referral code!

---

## Step 5: Verify Webhook Processing (Optional)

### 5.1 Check Webhook Logs

**In the terminal where `npm run dev` is running:**

Look for log messages like:
```
[shopify-api/INFO] Webhook received: orders/create
Order ID: gid://shopify/Order/123456789
```

### 5.2 Verify Database Updated

**In Prisma Studio:**

- Check `ReferralJoin` table
- Status might be updated by webhook processing

---

## 🐛 Troubleshooting

### Issue: Referral link not showing on Thank You page

**Check:**
1. Browser console (F12) for errors
2. Network tab for API call to `/apps/gachi-rewards/api/generate`
3. Terminal logs for server errors
4. Extension is enabled in Checkout Editor
5. API URL in extension settings is: `/apps/gachi-rewards/api/generate`

**Common errors:**
- `"Invalid request signature"` → App Proxy not configured correctly
- `"Failed to load referral link"` → Check App Proxy URL in Partners Dashboard
- `404 Not Found` → API route not accessible

### Issue: Discount not applying

**Check:**
1. Browser console for "Referral applied" message
2. Cart attributes contain `gachi_discount_code`
3. `checkout-discount-applier` extension is enabled
4. Discount code exists in Shopify Admin → Discounts
5. Storefront script is enabled (Theme settings → App embeds)

### Issue: Database not updating

**Check:**
1. Database is accessible (`npm run db:studio` works)
2. No database lock errors
3. Webhook is firing (check terminal logs)
4. App has correct permissions

### Issue: API errors

**Check:**
1. App Proxy is configured correctly in Partners Dashboard
2. Dev server is running
3. API URL in extension settings is: `/apps/gachi-rewards/api/generate`
4. Browser console for API response errors
5. Terminal logs for server-side errors

---

## ✅ Success Criteria

The test is successful if:

- [x] Customer A gets referral code after purchase
- [x] Referral link appears on Thank You page
- [x] Customer B can use referral link
- [x] Discount automatically applies for Customer B
- [x] Referral is tracked in `ReferralJoin` table
- [x] Customer B gets their own referral code
- [x] Database records are created correctly

---

## 📊 Expected Database State After Testing

**After completing all steps:**

- **StorefrontUser**: 2 records (Alice and Bob)
- **ReferralDiscountCode**: 2 records (one per customer)
- **ReferralJoin**: 1 record (Bob's purchase using Alice's code)
- **ReferralSafeLink**: 1+ records (safe links generated and used)
- **ReferralConfig**: 1 record (shop configuration)

---

## 🎯 Quick Test Checklist

Use this checklist as you test:

- [ ] Step 1: Database viewer open
- [ ] Step 2: Customer A completes purchase
- [ ] Step 2: Referral link appears on Thank You page
- [ ] Step 2: Database has Customer A record
- [ ] Step 3: Customer B uses referral link
- [ ] Step 3: Discount applies automatically
- [ ] Step 3: Customer B completes purchase
- [ ] Step 3: Database has ReferralJoin record
- [ ] Step 4: Customer B gets their own referral code
- [ ] Step 4: Database has Customer B record

---

## 💡 Tips

1. **Use different browsers/incognito** to simulate different customers
2. **Keep browser console open** to see JavaScript logs
3. **Keep terminal open** to see server/webhook logs
4. **Keep Prisma Studio open** to watch database changes
5. **Use real email addresses** (they're stored in database)
6. **Test both logged-in and guest checkout** scenarios
7. **Check Network tab** in DevTools to see API calls

---

## 🔍 What to Watch For

### Browser Console (F12)
- `"Fetching referral link from: /apps/gachi-rewards/api/generate"`
- `"Referral API response: {success: true, ...}"`
- `"Referral applied: GACHI-ALICE123"`
- Any error messages

### Terminal (where `npm run dev` is running)
- API request logs
- Webhook received messages
- Database query logs
- Error messages

### Network Tab (DevTools)
- Request to `/apps/gachi-rewards/api/generate`
- Response status (should be 200)
- Response body (should have `success: true`)

---

**Happy Testing! 🚀**

