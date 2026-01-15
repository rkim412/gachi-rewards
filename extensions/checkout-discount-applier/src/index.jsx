import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function extension() {
  render(<CheckoutDiscountApplier />, document.body);
}

function CheckoutDiscountApplier() {
  const [applied, setApplied] = useState(false);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (typeof shopify === 'undefined' || !shopify.cart || !shopify.applyDiscountCode) {
      setStatus('unavailable');
      return;
    }

    (async () => {
      try {
        const cart = await shopify.cart;
        let discountCode = null;
        let source = 'none';

        // Try cart metafields first (preferred method - app-owned, namespace: $app)
        if (cart?.metafields) {
          const metafield = cart.metafields.find(
            mf => mf.namespace === '$app' && mf.key === 'shopify_discount_code'
          );
          if (metafield?.value) {
            discountCode = metafield.value;
            source = 'metafield';
          }
        }

        // Fallback to cart attributes (backward compatibility)
        if (!discountCode && cart?.attributes) {
          const attribute = cart.attributes.find(
            attr => attr.key === "referral_shopify_discount_code"
          );
          if (attribute?.value) {
            discountCode = attribute.value;
            source = 'attribute';
          }
        }

        // Also check URL parameters (if customer came directly to checkout with ?ref=CODE)
        if (!discountCode && typeof window !== 'undefined') {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get('ref');
            
            if (refCode) {
              // Call App Proxy to create safe link
              const shopDomain = shopify.shop?.domain || '';
              const proxyUrl = `/apps/gachi-rewards/api/safe-link?referralCode=${encodeURIComponent(refCode)}&shop=${encodeURIComponent(shopDomain)}`;
              
              const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.shopifyDiscountCode) {
                  discountCode = data.shopifyDiscountCode;
                  source = 'url';
                  
                  // Try to set metafields via backend API
                  if (cart?.id) {
                    try {
                      await fetch('/apps/gachi-rewards/api/set-cart-metafields', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          cartId: cart.id,
                          shopifyDiscountCode: data.shopifyDiscountCode,
                          discountPercentage: data.discountPercentage || "10.0",
                          discountType: data.discountType || "percentage",
                        }),
                      });
                    } catch (metafieldError) {
                      console.warn('Failed to set cart metafields:', metafieldError);
                    }
                  }
                }
              }
            }
          } catch (urlError) {
            console.warn('Error checking URL parameters:', urlError);
          }
        }
        
        if (discountCode && !applied) {
          await shopify.applyDiscountCode(discountCode);
          setApplied(true);
          setStatus('applied');
          console.log(`Referral discount applied from ${source}:`, discountCode);
        } else {
          setStatus('none');
        }
      } catch (error) {
        console.error('Error in checkout extension:', error);
        setStatus('error');
      }
    })();
  }, [applied]);

  if (status === 'checking' || status === 'none') {
    return null; // Don't show anything while checking or if no discount
  }

  if (status === 'applied') {
    return (
      <s-banner status="success">
        <s-text size="small">Referral discount applied!</s-text>
      </s-banner>
    );
  }

  if (status === 'error') {
    return (
      <s-banner status="critical">
        <s-text size="small">Unable to apply referral discount. Please contact support.</s-text>
      </s-banner>
    );
  }

  return null;
}
