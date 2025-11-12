import React from "react";
import {
  reactExtension,
  useApi,
  Text,
  BlockStack,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <CheckoutDiscountApplier />
));

function CheckoutDiscountApplier() {
  const { query, applyDiscountCode } = useApi();
  const [applied, setApplied] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    applyDiscountFromCart();
  }, []);

  const applyDiscountFromCart = async () => {
    try {
      // Get cart attributes
      const cart = await query("cart");
      const attributes = cart?.attributes || [];

      const gachiRef = attributes.find(attr => attr.key === "gachi_ref");
      const gachiDiscountCode = attributes.find(attr => attr.key === "gachi_discount_code");

      if (gachiDiscountCode?.value && !applied) {
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

