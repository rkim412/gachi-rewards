# Cart Metafields Migration Guide

## Overview
This document tracks the migration from cart attributes to cart metafields for improved reliability, security, and Checkout UI Extension compatibility.

## Implementation Status

### ✅ Phase 1: Add Metafield Support (Backward Compatible) - COMPLETE

**Files Created/Modified:**
- ✅ `shopify.app.toml` - Added metafield definitions
- ✅ `app/services/storefront.server.js` - New helper for Storefront API client
- ✅ `app/routes/apps.gachi-rewards.api.set-cart-metafields.jsx` - New endpoint for setting metafields
- ✅ `extensions/storefront-script/assets/applyReferral.js` - Updated to try metafields first, fallback to attributes

**Changes:**
1. Added 3 cart metafield definitions:
   - `gachi_rewards.shopify_discount_code` (single_line_text_field)
   - `gachi_rewards.discount_percentage` (number_decimal)
   - `gachi_rewards.discount_type` (single_line_text_field)

2. Storefront script now:
   - Gets cart ID from `/cart.js`
   - Tries to set metafields via backend API first
   - Falls back to cart attributes if metafields fail
   - Logs which method was used

### ✅ Phase 2: Update Discount Function - COMPLETE

**Files Modified:**
- ✅ `extensions/referral-discount-function/src/run.graphql` - Added metafield queries with attribute fallback
- ✅ `extensions/referral-discount-function/src/cart_lines_discounts_generate_run.rs` - Updated to read metafields first, fallback to attributes

**Changes:**
1. GraphQL query now reads both metafields and attributes
2. Rust code tries metafields first, falls back to attributes
3. Maintains full backward compatibility

### ✅ Phase 3: Enhance Checkout UI Extension - COMPLETE

**Files Modified:**
- ✅ `extensions/checkout-discount-applier/shopify.extension.toml` - Added network access capability
- ✅ `extensions/checkout-discount-applier/src/index.jsx` - Enhanced to read metafields, handle URL parameters

**Changes:**
1. Extension now:
   - Reads cart metafields first (preferred)
   - Falls back to cart attributes
   - Handles URL parameters (`?ref=CODE`) for direct checkout access
   - Sets metafields if URL parameter detected
   - Shows status messages (success/error)

### ⏸️ Phase 4: Remove Cart Attributes - DEFERRED

This phase is optional and should only be done after:
- Metafields are proven stable in production
- All stores have migrated
- Monitoring shows no issues

## Configuration Required

### Environment Variable
Add to your `.env` file:
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_api_access_token
```

**How to get Storefront API Access Token:**
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → Create app
3. Configure Admin API scopes (if needed)
4. Go to "API credentials" tab
5. Under "Storefront API", click "Configure"
6. Enable required scopes (read_cart, write_cart)
7. Save and copy the Storefront API access token

**Note:** If `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is not set, the system will:
- Try to use session access token (may not work for Storefront API)
- Fall back to cart attributes (backward compatible)

## Testing Checklist

### Phase 1 Testing: Storefront Script
- [ ] Visit storefront with `?ref=ALICE123` in URL
- [ ] Check browser console for "Referral discount applied" message
- [ ] Verify message shows "(via metafields)" or "(via attributes)"
- [ ] Check cart attributes are still set (fallback)
- [ ] Verify localStorage is updated
- [ ] Test with invalid cart ID (should fallback to attributes)

### Phase 2 Testing: Discount Function
- [ ] Add items to cart after applying referral
- [ ] Proceed to checkout
- [ ] Verify discount is applied automatically
- [ ] Check discount shows correct percentage
- [ ] Verify discount code is associated correctly
- [ ] Test with both metafields and attributes (should work with both)

### Phase 3 Testing: Checkout UI Extension
- [ ] Test checkout with referral applied via storefront script
- [ ] Test checkout with direct `?ref=CODE` in checkout URL
- [ ] Verify extension shows "Referral discount applied!" message
- [ ] Test error handling (should show error message if fails)
- [ ] Verify metafields are set when URL parameter detected

### Integration Testing
- [ ] Complete full flow: Click referral link → Add to cart → Checkout → Order
- [ ] Verify webhook processes order correctly
- [ ] Check `ReferralSafeLink` is marked as used
- [ ] Verify `ReferralJoin` is created
- [ ] Test with returning customer (should use existing referral code)

## Known Issues / Limitations

1. **Storefront API Access Token**: 
   - Currently requires manual configuration
   - If not set, falls back to cart attributes (works but not optimal)
   - Consider adding admin UI to configure per-shop tokens

2. **Cart ID Retrieval**:
   - Relies on `/cart.js` endpoint
   - May fail in some edge cases (falls back gracefully)

3. **Checkout UI Extension Network Access**:
   - Requires `network_access` capability
   - May need merchant approval in some cases

## Rollback Plan

If issues arise, the system automatically falls back to cart attributes:
1. Storefront script will use attributes if metafields fail
2. Discount Function reads attributes if metafields unavailable
3. Checkout UI Extension uses attributes as fallback

To fully rollback:
1. Remove metafield definitions from `shopify.app.toml`
2. Revert storefront script to only use attributes
3. Revert Discount Function to only read attributes
4. Revert Checkout UI Extension

## Next Steps

1. **Deploy to staging** and run full test suite
2. **Monitor logs** for metafield vs attribute usage
3. **Gather metrics** on success rates
4. **Configure Storefront API tokens** for production shops
5. **Plan Phase 4** (removing attributes) after stability confirmed

## Support

If you encounter issues:
1. Check browser console for error messages
2. Check server logs for API errors
3. Verify `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set correctly
4. Test with cart attributes fallback (should always work)
