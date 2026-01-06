import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function extension() {
  render(<CheckoutDiscountApplier />, document.body);
}

function CheckoutDiscountApplier() {
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (typeof shopify === 'undefined' || !shopify.cart || !shopify.applyDiscountCode) {
      return;
    }

    (async () => {
      try {
        const cart = await shopify.cart;
        const discountCode = cart?.attributes?.find(attr => attr.key === "gachi_discount_code")?.value;
        
        if (discountCode && !applied) {
          await shopify.applyDiscountCode(discountCode);
          setApplied(true);
        }
      } catch {}
    })();
  }, [applied]);

  return applied ? (
    <s-stack direction="block">
      <s-text size="small" appearance="subdued">
        Referral discount applied!
      </s-text>
    </s-stack>
  ) : null;
}
