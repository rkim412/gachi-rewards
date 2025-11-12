import React from "react";
import {
  reactExtension,
  useApi,
  Text,
  BlockStack,
  Button,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.thank-you.block.render", () => (
  <ReferralThankYou />
));

function ReferralThankYou() {
  const { query } = useApi();
  const [loading, setLoading] = React.useState(false);
  const [referralLink, setReferralLink] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchReferralLink();
  }, []);

  const fetchReferralLink = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get order info from Order Confirmation API
      const order = await query("purchase");
      const customer = order?.customer;

      if (!customer?.id) {
        setError("Customer information not available");
        return;
      }

      // Use App Proxy URL (secure, no API keys exposed)
      const apiUrl = query("settings.api_url") || "/apps/gachi-rewards/api/generate";
      const proxyUrl = `${apiUrl}?orderId=${encodeURIComponent(order.id)}&customerId=${encodeURIComponent(customer.id)}&customerEmail=${encodeURIComponent(customer.email || "")}`;
      
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setReferralLink(data.referralLink);
      } else {
        setError(data.error || "Failed to generate referral link");
      }
    } catch (err) {
      console.error("Error fetching referral link:", err);
      setError("Failed to load referral link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        // Show success message
        alert("Referral link copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  if (loading) {
    return (
      <BlockStack>
        <Text>Generating your referral link...</Text>
      </BlockStack>
    );
  }

  if (error) {
    return (
      <Banner status="critical">
        <Text>{error}</Text>
      </Banner>
    );
  }

  if (!referralLink) {
    return null;
  }

  return (
    <BlockStack spacing="base">
      <Text size="large" emphasis="bold">
        🎉 Share your link and give friends 10% off!
      </Text>
      <Text>Copy your referral link below:</Text>
      <BlockStack spacing="tight">
        <Text size="small" appearance="subdued">
          {referralLink}
        </Text>
        <Button onPress={copyToClipboard}>Copy Referral Link</Button>
      </BlockStack>
    </BlockStack>
  );
}

