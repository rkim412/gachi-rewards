# Referral Discount Function

This Shopify Function applies referral discounts based on cart attributes set by the storefront script.

## How it works

1. Storefront script detects `?ref=CODE` in URL
2. Calls `/apps/gachi-rewards/api/safe-link` to get a one-time code
3. Stores `gachi_one_time_code`, `gachi_discount_percentage`, and `gachi_discount_type` in cart attributes
4. This Discount Function reads the cart attributes and applies the discount
5. Backend validates the safe link when the order is created

## Building

The function is automatically built by Shopify CLI when you run `shopify app deploy`.

To build manually:
```bash
cd extensions/referral-discount-function
cargo build --target wasm32-wasip1 --release
```

## Testing

1. Add a product to cart
2. Visit storefront with `?ref=REFERRALCODE` in URL
3. The discount should be applied automatically in checkout
4. Complete the purchase to verify the discount is applied





