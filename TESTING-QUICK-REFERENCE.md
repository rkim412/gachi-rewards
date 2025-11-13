# Testing Quick Reference

Quick commands and checks for testing the Gachi Rewards referral loop.

---

## 🚀 Quick Start Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open database viewer (in another terminal)
npm run db:studio

# 3. Test the flow:
#    - Make purchase as Customer A
#    - Get referral link from Thank You page
#    - Use link as Customer B (incognito window)
#    - Verify discount applies
#    - Complete purchase
#    - Check database for ReferralJoin record
```

---

## 🔍 Database Checks

### View All Referrals
```sql
-- In Prisma Studio, check:
ReferralJoin table → See all completed referrals
```

### Check Customer Referral Codes
```sql
-- In Prisma Studio:
StorefrontUser → Click on customer → Check referralDiscountCode relation
```

### Count Referrals Per Customer
```sql
-- In Prisma Studio:
ReferralDiscountCode → Click on code → Check referralJoins count
```

---

## 🧪 Test Scenarios

### Scenario 1: First-Time Customer
1. Visit storefront
2. Add product to cart
3. Checkout as new customer
4. **Expected:** Referral code on Thank You page

### Scenario 2: Using Referral Link
1. Copy referral link: `?ref=ALICE123`
2. Open incognito window
3. Visit link
4. Add product, go to checkout
5. **Expected:** Discount auto-applied

### Scenario 3: Referral Tracking
1. Complete purchase with referral
2. Check database: `ReferralJoin` table
3. **Expected:** New record with order details

---

## 🐛 Common Issues & Fixes

| Issue | Quick Fix |
|-------|-----------|
| No referral link on Thank You | Check extension enabled in Checkout settings |
| Discount not applying | Check `checkout-discount-applier` extension enabled |
| Database errors | Run `npm run db:migrate` |
| "Invalid signature" | Check App Proxy config in Partners Dashboard |

---

## 📊 Expected Database State

**After Customer A's purchase:**
- `StorefrontUser`: 1 record
- `ReferralDiscountCode`: 1 record
- `ReferralJoin`: 0 records

**After Customer B uses referral:**
- `StorefrontUser`: 2 records
- `ReferralDiscountCode`: 2 records
- `ReferralJoin`: 1 record (Bob's purchase)
- `ReferralSafeLink`: 1+ records

---

## 🔗 Key URLs to Test

```
# Storefront with referral
https://yourstore.myshopify.com/?ref=ALICE123

# App Proxy endpoints (for debugging)
https://yourstore.myshopify.com/apps/gachi-rewards/api/generate
https://yourstore.myshopify.com/apps/gachi-rewards/api/safe-link

# Thank You page (after checkout)
https://yourstore.myshopify.com/thank_you?order=...
```

---

## ✅ Testing Checklist

- [ ] Customer A gets referral code
- [ ] Referral link works
- [ ] Discount auto-applies
- [ ] Referral tracked in database
- [ ] Customer B gets their own code
- [ ] Self-referral prevented
- [ ] Guest checkout works

---

**See `TEST-REFERRAL-LOOP.md` for detailed instructions.**

