# Testing the Gachi Rewards Referral Loop

Complete guide to test the referral system end-to-end in your Shopify development store.

---

## 🎯 Overview: How the Referral Loop Works

1. **Customer A** makes a purchase → Gets a referral code (e.g., `ALICE123`)
2. **Customer A** shares link: `https://yourstore.myshopify.com/?ref=ALICE123`
3. **Customer B** clicks link → Discount code automatically applied
4. **Customer B** completes purchase → Referral tracked in database
5. **Customer B** gets their own referral code → Loop continues!

---

## ✅ Prerequisites

Before testing, ensure:

- [ ] App is installed in your development store
- [ ] Dev server is running (`npm run dev`)
- [ ] Database migrations are complete (`npm run db:migrate`)
- [ ] App Proxy is configured in Partners Dashboard
- [ ] Theme app extension is enabled (App Embed Block)
- [ ] Checkout extensions are deployed

---

## 📋 Step-by-Step Testing Guide

### Part 1: Initial Setup & Verification

#### 1.1 Verify App is Installed

1. Go to your **Shopify Admin** → **Apps**
2. Confirm **"Gachi Rewards"** appears in the list
3. Click on it to open the app interface

#### 1.2 Check Database is Ready

```bash
# Open Prisma Studio to view database
npm run db:studio
```

**Verify these tables exist:**
- `Session` (Shopify auth sessions)
- `StorefrontUser` (customers with referral codes)
- `ReferralDiscountCode` (referral codes and discounts)
- `ReferralJoin` (completed referrals)
- `ReferralConfig` (shop settings)

#### 1.3 Verify Extensions are Active

**In Shopify Admin:**

1. Go to **Settings** → **Checkout**
2. Scroll to **Checkout extensions**
3. Verify:
   - ✅ **checkout-discount-applier** is enabled
   - ✅ **thank-you-referral** is enabled

4. Go to **Online Store** → **Themes** → **Customize**
5. Go to **Theme settings** → **App embeds**
6. Verify:
   - ✅ **Referral Script** is enabled

---

### Part 2: Test the Full Referral Flow

#### 2.1 Create First Customer (Customer A - The Referrer)

**Step 1: Make a test purchase**

1. Open your storefront: `https://your-dev-store.myshopify.com`
2. Add a product to cart
3. Go to checkout
4. **Create a customer account** (important!)
   - Use email: `alice@test.com`
   - Complete checkout

**Step 2: Verify referral code generation**

1. After checkout, you should see the **Thank You page**
2. Look for the **"Share and earn rewards!"** section
3. You should see:
   - ✅ A referral link (e.g., `https://yourstore.myshopify.com/?ref=ALICE123`)
   - ✅ A "Copy Referral Link" button

**Step 3: Verify in database**

```bash
# In Prisma Studio or via query
npm run db:studio
```

**Check these records:**

1. **StorefrontUser** table:
   - Should have a record for `alice@test.com`
   - Note the `id` and `storefrontUserId`

2. **ReferralDiscountCode** table:
   - Should have a record linked to Alice
   - Note the `referralCode` (e.g., `ALICE123`)
   - Note the `discountCode` (e.g., `GACHI-ALICE123`)

3. **ReferralConfig** table:
   - Should have default settings for your shop
   - `amount` should be `10.0` (10% discount)

---

#### 2.2 Test Referral Link (Customer B - The Referee)

**Step 1: Use the referral link**

1. **Open an incognito/private browser window** (to simulate a different customer)
2. Visit the referral link from Step 2.1:
   ```
   https://yourstore.myshopify.com/?ref=ALICE123
   ```

**Step 2: Verify discount is applied**

1. **Open browser console** (F12 → Console tab)
2. Look for log message: `"Referral applied: GACHI-ALICE123"`
3. Add a product to cart
4. Go to checkout
5. **Verify discount code is automatically applied:**
   - Look for discount in order summary
   - Should show 10% off (or configured amount)

**Step 3: Complete purchase as Customer B**

1. **Create a different customer account:**
   - Email: `bob@test.com`
   - Complete checkout

**Step 4: Verify referral tracking**

After checkout, check the database:

```bash
npm run db:studio
```

**Check ReferralJoin table:**
- Should have a new record
- `refereeEmail` = `bob@test.com`
- `referralCodeId` = links to Alice's referral code
- `discountCode` = `GACHI-ALICE123`
- `status` = `pending`
- `orderId` = Shopify order ID

**Check ReferralSafeLink table:**
- Should have a record for the one-time code used
- `used` = `true`
- `usedByOrderId` = Bob's order ID

---

#### 2.3 Verify Customer B Gets Their Own Referral Code

1. After Customer B's checkout, check the **Thank You page**
2. Customer B should see:
   - ✅ Their own referral link (e.g., `?ref=BOB456`)
   - ✅ "Copy Referral Link" button

3. **Verify in database:**
   - `StorefrontUser` should have Bob's record
   - `ReferralDiscountCode` should have Bob's referral code

---

### Part 3: Test Edge Cases

#### 3.1 Test Self-Referral Prevention

1. Use Alice's referral link while logged in as Alice
2. Try to complete checkout
3. **Expected:** Self-referral should be prevented (check webhook logs)

#### 3.2 Test Guest Checkout

1. Use a referral link
2. Complete checkout **without creating an account**
3. **Expected:**
   - Discount should still apply
   - Referral should be tracked (with `refereeStorefrontUserId` as null)
   - Guest email should be stored in `refereeEmail`

#### 3.3 Test Invalid Referral Code

1. Visit: `https://yourstore.myshopify.com/?ref=INVALID123`
2. **Expected:**
   - No discount applied
   - No errors (graceful failure)
   - Checkout proceeds normally

#### 3.4 Test Expired Safe Link

1. Create a referral link
2. Wait for it to expire (default: 7 days)
3. Try to use it
4. **Expected:** New safe link should be generated

---

### Part 4: Verify Webhook Processing

#### 4.1 Check Order Webhook

When an order is created with a referral discount:

1. **Check webhook logs** in your terminal (where `npm run dev` is running)
2. Look for: `"Webhook received: orders/create"`
3. **Verify in database:**
   - `ReferralJoin` record should be created/updated
   - `status` should be set appropriately

#### 4.2 Test Webhook Manually (Optional)

```bash
# In your terminal, you should see webhook logs like:
[shopify-api/INFO] Webhook received: orders/create
Order ID: gid://shopify/Order/123456789
```

---

### Part 5: Database Verification Queries

Use Prisma Studio (`npm run db:studio`) to run these checks:

#### 5.1 Check All Referrals

**View all referral joins:**
- Open `ReferralJoin` table
- Should see all completed referrals
- Check `status`, `orderId`, `discountAmount`

#### 5.2 Check Referral Performance

**Count referrals per customer:**
- Open `ReferralDiscountCode` table
- Click on a referral code
- Check `referralJoins` relation
- Count how many people were referred

#### 5.3 Check Shop Configuration

**View shop settings:**
- Open `ReferralConfig` table
- Verify `amount` (discount percentage)
- Verify `enabled` is `true`

---

## 🔍 Troubleshooting

### Issue: Referral link not showing on Thank You page

**Check:**
1. Is the `thank-you-referral` extension enabled in Checkout settings?
2. Check browser console for errors
3. Verify App Proxy is configured correctly
4. Check network tab for API call to `/apps/gachi-rewards/api/generate`

### Issue: Discount not applying automatically

**Check:**
1. Is the `checkout-discount-applier` extension enabled?
2. Check browser console for errors
3. Verify cart attributes contain `gachi_discount_code`
4. Check if discount code exists in Shopify Admin → Discounts

### Issue: Referral not tracked in database

**Check:**
1. Verify webhook is registered: `orders/create`
2. Check webhook logs in terminal
3. Verify `ReferralJoin` table for new records
4. Check if order has discount code applied

### Issue: "Invalid request signature" error

**Check:**
1. App Proxy configuration in Partners Dashboard
2. Verify subpath prefix and subpath match `shopify.app.toml`
3. Check App Proxy URL in theme settings

### Issue: Database errors

**Check:**
1. Run migrations: `npm run db:migrate`
2. Verify database file exists: `prisma/dev.sqlite`
3. Check for lock files and remove them

---

## 📊 Testing Checklist

Use this checklist to verify everything works:

### Setup
- [ ] App installed in development store
- [ ] Database migrations complete
- [ ] Extensions deployed and enabled
- [ ] App Proxy configured

### First Purchase (Customer A)
- [ ] Customer A completes checkout
- [ ] Referral code generated
- [ ] Referral link shown on Thank You page
- [ ] Database record created in `StorefrontUser`
- [ ] Database record created in `ReferralDiscountCode`

### Referral Link Usage (Customer B)
- [ ] Customer B visits referral link
- [ ] Discount code automatically applied
- [ ] Cart attributes contain referral info
- [ ] Customer B completes checkout
- [ ] Database record created in `ReferralJoin`
- [ ] Safe link marked as used

### Customer B's Referral Code
- [ ] Customer B gets their own referral code
- [ ] Customer B's referral link works
- [ ] Database records created for Customer B

### Webhooks
- [ ] Order webhook fires on purchase
- [ ] Referral tracking updates correctly
- [ ] No duplicate records created

### Edge Cases
- [ ] Self-referral prevention works
- [ ] Guest checkout works
- [ ] Invalid referral codes handled gracefully
- [ ] Expired links handled correctly

---

## 🚀 Quick Test Script

Here's a quick way to test the full loop:

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, open database viewer
npm run db:studio

# 3. Make a test purchase as Customer A
# 4. Copy the referral link from Thank You page
# 5. Open incognito window and use referral link
# 6. Make a test purchase as Customer B
# 7. Check database for ReferralJoin record
```

---

## 📝 Expected Database State After Testing

After completing the full test, you should have:

**StorefrontUser:**
- 2 records (Alice and Bob)

**ReferralDiscountCode:**
- 2 records (one for each customer)

**ReferralJoin:**
- 1 record (Bob's purchase using Alice's code)

**ReferralSafeLink:**
- 1+ records (safe links generated and used)

**ReferralConfig:**
- 1 record (shop configuration)

---

## 🎉 Success Criteria

The referral loop is working correctly if:

1. ✅ Customers get referral codes after first purchase
2. ✅ Referral links apply discounts automatically
3. ✅ Referrals are tracked in the database
4. ✅ Each new customer gets their own referral code
5. ✅ The loop can continue indefinitely

---

## 💡 Tips for Testing

1. **Use different browsers/incognito** to simulate different customers
2. **Check browser console** for JavaScript errors
3. **Monitor terminal logs** for webhook and API calls
4. **Use Prisma Studio** to inspect database in real-time
5. **Test with real email addresses** (they're stored in the database)
6. **Test both logged-in and guest checkout** scenarios

---

## 🔗 Related Documentation

- `DEPLOY-AND-TEST.md` - Initial deployment guide
- `QUICK-START.md` - Quick setup guide
- `FIX-DATABASE-ERRORS.md` - Troubleshooting database issues

---

**Happy Testing! 🎯**

