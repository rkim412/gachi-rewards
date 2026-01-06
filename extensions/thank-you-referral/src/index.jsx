import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function extension() {
  render(<ReferralThankYou />, document.body);
}

function ReferralThankYou() {
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReferralLink();
  }, []);

  const fetchReferralLink = async () => {
    try {
      setLoading(true);
      setError(null);

      // Access data from global shopify object
      let order = null;
      let customer = null;
      let email = null;
      let apiUrl = "/apps/gachi-rewards/api/generate";

      try {
        if (typeof shopify !== 'undefined') {
          // Access order confirmation
          if (shopify.orderConfirmation) {
            const orderConfirmation = await shopify.orderConfirmation;
            order = orderConfirmation?.order;
          }
          
          // Access buyer identity
          if (shopify.buyerIdentity) {
            const buyerIdentity = await shopify.buyerIdentity;
            customer = buyerIdentity?.customer;
            email = customer?.email || buyerIdentity?.email;
          }
          
          // Access settings
          if (shopify.settings) {
            const settings = await shopify.settings;
            if (settings?.api_url) {
              apiUrl = settings.api_url;
            }
          }
        }
      } catch (apiError) {
        // Fallback if shopify object not available
      }

      const params = new URLSearchParams();
      if (order?.id) params.append("orderId", order.id);
      if (order?.number) params.append("orderNumber", order.number);
      if (customer?.id) params.append("customerId", customer.id);
      if (email) params.append("customerEmail", email);

      const response = await fetch(`${apiUrl}${params.toString() ? `?${params}` : ''}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.referralLink) {
        setReferralLink(data.referralLink);
        setReferralCode(data.referralCode || data.referralLink.match(/[?&]ref=([^&]+)/)?.[1]);
      } else {
        setError(data.error || "Failed to generate referral link");
      }
    } catch (err) {
      setError(`Failed to load referral link: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
      } catch {}
    }
  };

  if (loading) {
    return (
      <s-banner status="info">
        <s-text>Generating your referral link...</s-text>
      </s-banner>
    );
  }

  if (error || !referralLink) {
    return null;
  }

  return (
    <s-banner status="success">
      <s-stack direction="block" gap="base">
        <s-text size="large" emphasis="bold">
          Share and earn rewards!
        </s-text>
        <s-text>
          Share code <s-text emphasis="bold">{referralCode || "CODE"}</s-text> and earn 10% on each referral!
        </s-text>
        <s-stack direction="block" gap="tight">
          <s-text size="small" appearance="subdued">
            {referralLink}
          </s-text>
          <s-button onClick={copyToClipboard}>Copy Link</s-button>
        </s-stack>
      </s-stack>
    </s-banner>
  );
}
