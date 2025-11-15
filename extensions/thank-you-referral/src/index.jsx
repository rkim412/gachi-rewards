import React from "react";
import {
  reactExtension,
  Text,
  BlockStack,
  Button,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.thank-you.block.render", (api) => (
  <ReferralThankYou api={api} />
));

function ReferralThankYou({ api }) {
  const [loading, setLoading] = React.useState(true); // Start with true!
  const [referralLink, setReferralLink] = React.useState(null);
  const [referralCode, setReferralCode] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log("[Thank You Extension] Component mounted, API:", api);
    console.log("[Thank You Extension] orderConfirmation:", api?.orderConfirmation);
    console.log("[Thank You Extension] buyerIdentity:", api?.buyerIdentity);
    
    // Delay fetch to ensure extension is fully initialized
    const timer = setTimeout(() => {
      fetchReferralLink();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const fetchReferralLink = async () => {
    try {
      console.log("[Thank You Extension] Starting fetchReferralLink");
      setLoading(true);
      setError(null);

      // Access orderConfirmation from OrderConfirmationApi
      let orderConfirmation = null;
      let order = null;
      
      try {
        orderConfirmation = api?.orderConfirmation?.value;
        order = orderConfirmation?.order;
        console.log("[Thank You Extension] Order confirmation:", orderConfirmation);
        console.log("[Thank You Extension] Order:", order);
      } catch (apiError) {
        console.warn("[Thank You Extension] Error accessing orderConfirmation:", apiError);
      }
      
      // Access buyerIdentity for customer information
      let buyerIdentity = null;
      let customer = null;
      
      try {
        buyerIdentity = api?.buyerIdentity;
        customer = buyerIdentity?.customer?.value;
        console.log("[Thank You Extension] Buyer identity:", buyerIdentity);
        console.log("[Thank You Extension] Customer:", customer);
      } catch (apiError) {
        console.warn("[Thank You Extension] Error accessing buyerIdentity:", apiError);
      }
      
      // Access settings from StandardApi
      let settings = null;
      let apiUrl = "/apps/gachi-rewards/api/generate";
      
      try {
        settings = api?.settings?.value;
        if (settings?.api_url) {
          apiUrl = settings.api_url;
        }
        console.log("[Thank You Extension] Settings:", settings);
      } catch (apiError) {
        console.warn("[Thank You Extension] Error accessing settings:", apiError);
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (order?.id) params.append("orderId", order.id);
      if (orderConfirmation?.number) params.append("orderNumber", orderConfirmation.number);
      
      // Get customer info from buyerIdentity
      if (customer?.id) params.append("customerId", customer.id);
      if (customer?.email) params.append("customerEmail", customer.email);
      
      // Fallback to buyerIdentity email if customer object not available
      if (!customer?.email && buyerIdentity?.email?.value) {
        params.append("customerEmail", buyerIdentity.email.value);
      }

      // Make API call - App Proxy will add shop, timestamp, signature automatically
      const proxyUrl = `${apiUrl}${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log("[Thank You Extension] Fetching referral link from:", proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[Thank You Extension] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Thank You Extension] API error:", response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("[Thank You Extension] Referral API response:", data);

      if (data.success && data.referralLink) {
        setReferralLink(data.referralLink);
        setReferralCode(data.referralCode || extractCodeFromLink(data.referralLink));
      } else {
        setError(data.error || "Failed to generate referral link");
      }
    } catch (err) {
      console.error("[Thank You Extension] Error fetching referral link:", err);
      setError(`Failed to load referral link: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractCodeFromLink = (link) => {
    if (!link) return null;
    const match = link.match(/[?&]ref=([^&]+)/);
    return match ? match[1] : null;
  };

  const copyToClipboard = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        alert("Referral link copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  if (loading) {
    return (
      <Banner status="info">
        <BlockStack spacing="tight">
          <Text>Generating your referral link...</Text>
        </BlockStack>
      </Banner>
    );
  }

  if (error) {
    console.error("Referral link error:", error);
    return (
      <Banner status="warning">
        <Text size="small">
          Referral link will be available soon.
        </Text>
      </Banner>
    );
  }

  if (!referralLink) {
    return null;
  }

  return (
    <Banner status="success">
      <BlockStack spacing="base">
        <Text size="large" emphasis="bold">
          You can make money promoting our products!
        </Text>
        <Text>
          Simply share the discount code we created just for you <Text emphasis="bold">{referralCode || "CODE"}</Text> and receive 10% every time someone purchases using your code!
        </Text>
        <Text size="small" appearance="subdued">
          <Text emphasis="bold">FULL OFFER DETAILS</Text>
        </Text>
        <Text size="medium" emphasis="bold">
          Share now and start earning ↓
        </Text>
        <BlockStack spacing="tight">
          <Text size="small" appearance="subdued">
            {referralLink}
          </Text>
          <Button onPress={copyToClipboard}>Copy Referral Link</Button>
        </BlockStack>
      </BlockStack>
    </Banner>
  );
}

