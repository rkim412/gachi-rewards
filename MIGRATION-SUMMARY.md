# Cart Metafields Migration - Complete Summary

## 🎯 Overview

This migration moves the Gachi Rewards referral system from cart attributes to cart metafields for improved reliability, security, and Checkout UI Extension compatibility. All changes maintain **full backward compatibility** with automatic fallback to cart attributes.

---

## ✅ Implementation Status

### Phase 1: Add Metafield Support (Backward Compatible) - ✅ COMPLETE

**Files Created:**
- `app/services/storefront.server.js` - Storefront API client helper
- `app/routes/apps.gachi-rewards.api.set-cart-metafields.jsx` - New endpoint for setting metafields
- `app/config/metafields.config.js` - Configuration for Phase 4 control

**Files Modified:**
- `shopify.app.toml` - Added 3 cart metafield definitions
- `extensions/storefront-script/assets/applyReferral.js` - Updated to try metafields first, fallback to attributes

**Key Changes:**
1. **Metafield Definitions Added:**
   - `gachi_rewards.shopify_discount_code` (single_line_text_field)
   - `gachi_rewards.discount_percentage` (number_decimal)
   - `gachi_rewards.discount_type` (single_line_text_field)

2. **Storefront Script Enhancement:**
   - Gets cart ID from `/cart.js` endpoint
   - Attempts to set metafields via backend API first
   - Falls back to cart attributes if metafields fail
   - Logs which method was used: "(via metafields)" or "(via attributes)"
   - Enhanced localStorage sync with metafield support

### Phase 2: Update Discount Function - ✅ COMPLETE

**Files Modified:**
- `extensions/referral-discount-function/src/run.graphql` - Added metafield queries with attribute fallback
- `extensions/referral-discount-function/src/cart_lines_discounts_generate_run.rs` - Updated to read metafields first, fallback to attributes

**Key Changes:**
1. **GraphQL Query:**
   - Queries both metafields and attributes
   - Metafields queried first (preferred)
   - Attributes as fallback (backward compatible)

2. **Rust Implementation:**
   - Tries metafields first using `.metafield_shopify_discount_code()`
   - Falls back to attributes using `.referral_shopify_discount_code()`
   - Same pattern for percentage and type
   - Maintains exact same discount application logic

### Phase 3: Enhance Checkout UI Extension - ✅ COMPLETE

**Files Modified:**
- `extensions/checkout-discount-applier/shopify.extension.toml` - Added network access capability
- `extensions/checkout-discount-applier/src/index.jsx` - Enhanced to read metafields, handle URL parameters

**Key Changes:**
1. **Network Access:**
   - Enabled `network_access` capability for App Proxy calls

2. **Enhanced Functionality:**
   - Reads cart metafields first (preferred)
   - Falls back to cart attributes
   - Handles URL parameters (`?ref=CODE`) for direct checkout access
   - Sets metafields if URL parameter detected
   - Shows status messages: success banner, error banner, or nothing

3. **Source Tracking:**
   - Logs which source was used: 'metafield', 'attribute', or 'url'

### Phase 4: Remove Cart Attributes (Optional) - ✅ READY

**Status:** Implemented but **disabled by default** for safety

**How to Enable:**
Set environment variable:
```bash
METAFIELDS_ONLY_MODE=true
```

**What It Does:**
- When enabled, skips cart attributes fallback
- Uses metafields exclusively
- Should only be enabled after:
  - Metafields proven stable in production
  - All stores have Storefront API tokens configured
  - Monitoring shows 100% metafield success rate

**Current Behavior:**
- Phase 4 is **disabled** (attributes fallback active)
- System works with both metafields and attributes
- Can be enabled gradually per shop or globally

---

## 📁 Files Changed Summary

### New Files Created (3)
1. `app/services/storefront.server.js` - Storefront API client
2. `app/routes/apps.gachi-rewards.api.set-cart-metafields.jsx` - Metafields API endpoint
3. `app/config/metafields.config.js` - Phase 4 configuration

### Modified Files (6)
1. `shopify.app.toml` - Added metafield definitions
2. `extensions/storefront-script/assets/applyReferral.js` - Metafields support with fallback
3. `extensions/referral-discount-function/src/run.graphql` - Added metafield queries
4. `extensions/referral-discount-function/src/cart_lines_discounts_generate_run.rs` - Metafields reading
5. `extensions/checkout-discount-applier/shopify.extension.toml` - Network access
6. `extensions/checkout-discount-applier/src/index.jsx` - Enhanced functionality

---

## 🔧 Configuration Required

### 1. Storefront API Access Token

**Required for metafields to work optimally**

Add to `.env`:
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_api_access_token
```

**How to Get:**
1. Shopify Admin → Settings → Apps and sales channels
2. Develop apps → Your app → API credentials
3. Storefront API section → Configure
4. Enable scopes: `read_cart`, `write_cart`
5. Copy the access token

**Note:** If not set, system falls back to:
- Session access token (may not work)
- Cart attributes (always works as fallback)

### 2. Phase 4 Control (Optional)

Add to `.env` to enable metafields-only mode:
```bash
METAFIELDS_ONLY_MODE=true  # Default: false (keeps attributes fallback)
```

---

## 🧪 Testing Guide

### Pre-Testing Setup

1. **Set Environment Variables:**
   ```bash
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
   METAFIELDS_ONLY_MODE=false  # Keep false for initial testing
   ```

2. **Deploy Changes:**
   - Push to staging environment
   - Verify all extensions deploy successfully
   - Check that metafield definitions are created in Shopify

### Test Scenario 1: Storefront Script with Metafields

**Steps:**
1. Visit storefront: `https://your-store.myshopify.com/products/item?ref=ALICE123`
2. Open browser console (F12)
3. Check for log message: `"Referral discount applied: GACHI-ALICE123-ABC1 (via metafields)"`

**Expected Results:**
- ✅ Console shows "(via metafields)" if successful
- ✅ Console shows "(via attributes)" if metafields failed (fallback)
- ✅ Cart attributes are set (for fallback)
- ✅ localStorage is updated
- ✅ URL parameter `?ref=ALICE123` is removed

**Verify:**
- Check Network tab for `/apps/gachi-rewards/api/set-cart-metafields` call
- Response should be `{ success: true }`
- If metafields fail, should see fallback to `/cart/update.js`

### Test Scenario 2: Storefront Script Fallback

**Steps:**
1. Temporarily break metafields endpoint (or don't set Storefront API token)
2. Visit: `https://your-store.myshopify.com/products/item?ref=ALICE123`
3. Check console

**Expected Results:**
- ✅ Console shows "(via attributes)" 
- ✅ Cart attributes are set successfully
- ✅ System continues to work normally

### Test Scenario 3: Discount Function with Metafields

**Steps:**
1. Apply referral via storefront script (Test Scenario 1)
2. Add items to cart
3. Proceed to checkout
4. Verify discount is applied

**Expected Results:**
- ✅ Discount appears automatically
- ✅ Discount shows correct percentage (e.g., "Referral Discount (10%)")
- ✅ Discount code is associated correctly
- ✅ Order total reflects discount

**Verify:**
- Check order details - discount code should be `GACHI-ALICE123-ABC1`
- Discount amount should match configured percentage

### Test Scenario 4: Discount Function with Attributes Fallback

**Steps:**
1. Apply referral (should use attributes if metafields unavailable)
2. Add items to cart
3. Proceed to checkout

**Expected Results:**
- ✅ Discount still applies (reading from attributes)
- ✅ Same discount behavior as metafields
- ✅ No difference in customer experience

### Test Scenario 5: Checkout UI Extension - Metafields

**Steps:**
1. Apply referral via storefront script
2. Go directly to checkout
3. Check for success banner

**Expected Results:**
- ✅ Banner shows: "Referral discount applied!"
- ✅ Discount code is applied automatically
- ✅ Console logs: `"Referral discount applied from metafield: GACHI-ALICE123-ABC1"`

### Test Scenario 6: Checkout UI Extension - URL Parameter

**Steps:**
1. Go directly to checkout with: `https://your-store.myshopify.com/checkout?ref=ALICE123`
2. Check for discount application

**Expected Results:**
- ✅ Extension detects `?ref=ALICE123` in URL
- ✅ Calls App Proxy to create safe link
- ✅ Sets metafields via backend API
- ✅ Applies discount code
- ✅ Shows success banner
- ✅ Console logs: `"Referral discount applied from url: GACHI-ALICE123-ABC1"`

### Test Scenario 7: Checkout UI Extension - Attributes Fallback

**Steps:**
1. Apply referral (using attributes if metafields fail)
2. Go to checkout

**Expected Results:**
- ✅ Extension reads from cart attributes
- ✅ Applies discount successfully
- ✅ Console logs: `"Referral discount applied from attribute: GACHI-ALICE123-ABC1"`

### Test Scenario 8: Full Integration Flow

**Steps:**
1. Customer clicks referral link: `store.com?ref=ALICE123`
2. Storefront script applies referral
3. Customer adds items to cart
4. Customer proceeds to checkout
5. Discount Function applies discount
6. Customer completes order
7. Webhook processes order

**Expected Results:**
- ✅ Safe link created in database
- ✅ Metafields or attributes set in cart
- ✅ Discount applied at checkout
- ✅ Order created with discount code
- ✅ Webhook finds safe link by discount code
- ✅ Safe link marked as used
- ✅ ReferralJoin created
- ✅ Customer becomes referrer (gets own code)

**Verify in Database:**
```sql
-- Check safe link was created and used
SELECT * FROM "ReferralSafeLink" WHERE "discountCode" = 'GACHI-ALICE123-ABC1';

-- Check referral join was created
SELECT * FROM "ReferralJoin" WHERE "orderId" = 'gid://shopify/Order/...';

-- Check customer became referrer
SELECT * FROM "StorefrontUser" WHERE "email" = 'customer@example.com';
SELECT * FROM "ReferralDiscountCode" WHERE "referrerStorefrontUserId" = ...;
```

### Test Scenario 9: Error Handling

**Steps:**
1. Break Storefront API (wrong token or network error)
2. Apply referral
3. Verify fallback works

**Expected Results:**
- ✅ System falls back to cart attributes
- ✅ No errors shown to customer
- ✅ Discount still applies
- ✅ Console shows warning but continues

### Test Scenario 10: Returning Customer

**Steps:**
1. Customer who already has referral code completes order
2. Check Thank You page

**Expected Results:**
- ✅ Existing referral code is shown (not new one)
- ✅ Same code they had before
- ✅ Webhook doesn't create duplicate

---

## 📊 Monitoring & Metrics

### What to Monitor

1. **Metafield Success Rate:**
   - Check console logs for "(via metafields)" vs "(via attributes)"
   - Target: >95% metafield success rate

2. **API Endpoint Performance:**
   - Monitor `/apps/gachi-rewards/api/set-cart-metafields` response times
   - Check error rates

3. **Discount Application:**
   - Verify discounts are applied at checkout
   - Check order discount codes match expected values

4. **Webhook Processing:**
   - Verify `ReferralSafeLink` is found by discount code
   - Check `ReferralJoin` creation rate

### Logging

The system logs:
- Which method was used (metafields vs attributes)
- Source of discount code (metafield, attribute, url)
- Any errors or fallbacks

Check logs for:
```
Referral discount applied: GACHI-ALICE123-ABC1 (via metafields)
Referral discount applied from metafield: GACHI-ALICE123-ABC1
Falling back to cart attributes
```

---

## 🔄 Rollback Plan

### Automatic Rollback
The system automatically falls back to cart attributes if:
- Metafields API fails
- Storefront API token not configured
- Cart ID unavailable
- Any error occurs

### Manual Rollback
If needed to fully revert:

1. **Remove metafield definitions:**
   - Comment out metafield definitions in `shopify.app.toml`

2. **Revert storefront script:**
   - Remove `setCartMetafields()` calls
   - Keep only `storeReferralDiscountInCart()`

3. **Revert Discount Function:**
   - Remove metafield queries from `run.graphql`
   - Remove metafield reading from Rust code

4. **Revert Checkout Extension:**
   - Remove metafield reading
   - Keep only attribute reading

**Note:** Full rollback should not be necessary due to automatic fallback.

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Set `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in environment
- [ ] Verify metafield definitions in `shopify.app.toml`
- [ ] Test locally with `shopify app dev`
- [ ] Verify all extensions build successfully

### Deployment
- [ ] Deploy to staging first
- [ ] Run full test suite (all 10 scenarios)
- [ ] Monitor logs for errors
- [ ] Verify metafield success rate >95%
- [ ] Deploy to production

### Post-Deployment
- [ ] Monitor for 24-48 hours
- [ ] Check error rates
- [ ] Verify discount application rates
- [ ] Gather metrics on metafield vs attribute usage
- [ ] Plan Phase 4 enablement (if metrics are good)

---

## 📝 Phase 4 Enablement (Future)

When ready to enable Phase 4 (metafields only):

1. **Prerequisites:**
   - Metafield success rate >99% for 30+ days
   - All production shops have Storefront API tokens
   - No customer-reported issues
   - Monitoring shows stable performance

2. **Enablement:**
   ```bash
   # Set in environment
   METAFIELDS_ONLY_MODE=true
   ```

3. **Monitor:**
   - Watch for any increase in errors
   - Verify discounts still apply
   - Check customer feedback

4. **Rollback:**
   - If issues arise, set `METAFIELDS_ONLY_MODE=false`
   - System will immediately use attributes fallback

---

## 🆘 Troubleshooting

### Issue: Metafields not being set

**Symptoms:**
- Console shows "(via attributes)" always
- No `/set-cart-metafields` API calls

**Solutions:**
1. Check `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set
2. Verify Storefront API scopes are enabled
3. Check API endpoint logs for errors
4. Verify cart ID is being retrieved correctly

### Issue: Discount not applying

**Symptoms:**
- Discount Function not running
- No discount at checkout

**Solutions:**
1. Check cart has metafields or attributes set
2. Verify Discount Function is deployed
3. Check GraphQL query is correct
4. Verify discount code format matches expected

### Issue: Checkout Extension not working

**Symptoms:**
- No banner shown
- Discount not applied in checkout

**Solutions:**
1. Verify `network_access` capability is enabled
2. Check extension is deployed
3. Verify App Proxy URL is correct
4. Check browser console for errors

---

## 📚 Additional Resources

- [Shopify Cart Metafields Documentation](https://shopify.dev/docs/api/storefront/latest/objects/CartMetafield)
- [Checkout UI Extensions API](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Discount Functions API](https://shopify.dev/docs/api/functions/reference/discount)
- [Storefront API Authentication](https://shopify.dev/docs/api/storefront#authentication)

---

## ✅ Summary

**All phases are complete and ready for testing!**

- ✅ Phase 1: Metafield support with backward compatibility
- ✅ Phase 2: Discount Function reads metafields
- ✅ Phase 3: Checkout UI Extension enhanced
- ✅ Phase 4: Optional metafields-only mode (disabled by default)

**Next Steps:**
1. Set `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
2. Run test scenarios 1-10
3. Deploy to staging
4. Monitor and gather metrics
5. Deploy to production when ready
