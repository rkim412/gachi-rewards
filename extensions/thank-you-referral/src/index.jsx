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

      // Try to get order info from Order Confirmation API (may not be available)
      let order = null;
      let customer = null;
      
      try {
        order = await query("purchase");
        customer = order?.customer;
      } catch (queryError) {
        // Purchase API may not be available - that's okay, we'll proceed without it
        console.warn("Could not get purchase data:", queryError);
      }

      // Build query parameters - handle both logged-in and guest customers
      const params = new URLSearchParams();
      if (order?.id) params.append("orderId", order.id);
      if (customer?.id) params.append("customerId", customer.id);
      if (customer?.email) params.append("customerEmail", customer.email);
      
      // Get API URL from settings (handle errors gracefully)
      let apiUrl = "/apps/gachi-rewards/api/generate";
      try {
        const settingsUrl = query("settings.api_url");
        if (settingsUrl) {
          apiUrl = settingsUrl;
        }
      } catch (settingsError) {
        console.warn("Could not get settings.api_url, using default:", settingsError);
      }

      // Make API call - App Proxy will add shop, timestamp, signature automatically
      const proxyUrl = `${apiUrl}?${params.toString()}`;
      
      console.log("Fetching referral link from:", proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Referral API response:", data);

      if (data.success && data.referralLink) {
        setReferralLink(data.referralLink);
      } else {
        setError(data.error || "Failed to generate referral link");
      }
    } catch (err) {
      console.error("Error fetching referral link:", err);
      setError(`Failed to load referral link: ${err.message}`);
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
      <BlockStack spacing="tight">
        <Text>Generating your referral link...</Text>
      </BlockStack>
    );
  }

  if (error) {
    // Show error but don't block the page - just log it
    console.error("Referral link error:", error);
    // Return null to hide the extension if there's an error
    // Or show a non-critical message
    return (
      <BlockStack spacing="tight">
        <Text size="small" appearance="subdued">
          Referral link will be available soon.
        </Text>
      </BlockStack>
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

