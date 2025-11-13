import React from "react";
import {
  reactExtension,
  Text,
  BlockStack,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <CheckoutDiscountApplier />
));

function CheckoutDiscountApplier() {
  const [applied, setApplied] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    applyDiscountFromCart();
  }, []);

  const applyDiscountFromCart = async () => {
    try {
      // Use global shopify object (API version 2025-10+)
      // No need for useApi() hook anymore!
      let cart = null;
      let applyDiscountCode = null;

      try {
        if (typeof shopify !== 'undefined') {
          if (shopify.cart) {
            cart = await shopify.cart;
          }
          if (shopify.applyDiscountCode) {
            applyDiscountCode = shopify.applyDiscountCode;
          }
        }
      } catch (apiError) {
        console.warn("Could not access shopify API:", apiError);
      }

      if (!cart || !applyDiscountCode) {
        console.warn("Cart or applyDiscountCode not available");
        return;
      }

      // Get cart attributes
      const attributes = cart?.attributes || [];

      const gachiRef = attributes.find(attr => attr.key === "gachi_ref");
      const gachiDiscountCode = attributes.find(attr => attr.key === "gachi_discount_code");

      if (gachiDiscountCode?.value && !applied && applyDiscountCode) {
        // Apply discount code programmatically
        await applyDiscountCode(gachiDiscountCode.value);
        setApplied(true);
      }
    } catch (err) {
      console.error("Error applying discount:", err);
      setError("Failed to apply discount");
    }
  };

  if (error) {
    return (
      <Banner status="critical">
        <Text>{error}</Text>
      </Banner>
    );
  }

  if (applied) {
    return (
      <BlockStack>
        <Text size="small" appearance="subdued">
          Referral discount applied!
        </Text>
      </BlockStack>
    );
  }

  return null;
}

