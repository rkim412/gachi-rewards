// Polaris web components extension for Checkout Thank You page
// Uses vanilla JavaScript with <s-*> custom elements
// No Preact, no Signals, no createComponent

// DIRECT URL APPROACH: Bypass app proxy to avoid password protection CORS issues
// Update this URL when the tunnel changes (run `shopify app dev` to get new URL)
const DIRECT_API_URL = 'https://alfred-manually-financing-horn.trycloudflare.com/apps/gachi-rewards/api/generate';

export default async function extension(api) {
  // Create container for the extension
  const container = document.createElement('s-stack');
  container.setAttribute('direction', 'block');
  container.setAttribute('gap', 'base');
  
  // Show loading state
  const loadingText = document.createElement('s-text');
  loadingText.textContent = 'Loading your referral code...';
  container.appendChild(loadingText);
  document.body.appendChild(container);

  try {
    // Fetch referral data
    const data = await fetchReferralLink(api);
    
    if (data && data.referralLink) {
      // Remove loading text
      container.removeChild(loadingText);
      
      // Create success banner
      const banner = document.createElement('s-banner');
      banner.setAttribute('tone', 'success');
      banner.setAttribute('heading', 'Share and earn rewards!');
      
      // Create content stack inside banner
      const contentStack = document.createElement('s-stack');
      contentStack.setAttribute('direction', 'block');
      contentStack.setAttribute('gap', 'small-100');
      
      // Referral code text (strong)
      const codeText = document.createElement('s-text');
      codeText.setAttribute('type', 'strong');
      codeText.textContent = `Your referral code: ${data.referralCode}`;
      contentStack.appendChild(codeText);
      
      // Reward description
      const rewardText = document.createElement('s-text');
      rewardText.textContent = 'Share this code and earn 10% on each referral!';
      contentStack.appendChild(rewardText);
      
      // Referral link (small + subdued)
      const linkText = document.createElement('s-text');
      linkText.setAttribute('type', 'small');
      linkText.setAttribute('color', 'subdued');
      linkText.textContent = data.referralLink;
      contentStack.appendChild(linkText);
      
      // Copy button
      const copyButton = document.createElement('s-button');
      copyButton.textContent = 'Copy Link';
      copyButton.onclick = async () => {
        try {
          await navigator.clipboard.writeText(data.referralLink);
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy Link';
          }, 2000);
        } catch (e) {
          console.log('[THANK YOU PAGE] Clipboard not available');
        }
      };
      contentStack.appendChild(copyButton);
      
      // Add content to banner
      banner.appendChild(contentStack);
      
      // Add banner to container
      container.appendChild(banner);
    }
  } catch (err) {
    console.error('[THANK YOU PAGE] Error:', err);
    // Remove loading text on error (silent fail)
    if (container.contains(loadingText)) {
      container.removeChild(loadingText);
    }
  }
}

async function fetchReferralLink(api) {
  // Safely extract data from API
  let shop = null;
  let orderId = null;
  let orderNumber = null;
  let customerId = null;
  let email = null;

  try {
    // Get shop domain
    if (api?.shop?.myshopifyDomain) {
      shop = String(api.shop.myshopifyDomain);
    }
    
    // Get order data
    if (api?.order?.id) {
      orderId = String(api.order.id);
    }
    if (api?.order?.number) {
      orderNumber = String(api.order.number);
    }
    
    // Get customer data
    if (api?.buyerIdentity?.customer?.id) {
      customerId = String(api.buyerIdentity.customer.id);
    }
    if (api?.buyerIdentity?.customer?.email) {
      email = String(api.buyerIdentity.customer.email);
    } else if (api?.buyerIdentity?.email) {
      email = String(api.buyerIdentity.email);
    }
  } catch (apiError) {
    console.log('[THANK YOU PAGE] Error accessing API:', apiError);
  }

  // Fallback: try global shopify object if api doesn't have data
  if (!shop || !orderId) {
    try {
      if (typeof shopify !== 'undefined') {
        if (!shop) {
          shop = String(shopify.shop?.myshopifyDomain || shopify.shop?.value?.myshopifyDomain || '');
        }
        if (!orderId) {
          const orderObj = shopify.orderConfirmation?.value?.order;
          orderId = orderObj?.id ? String(orderObj.id) : null;
          orderNumber = orderObj?.number ? String(orderObj.number) : null;
        }
        if (!customerId && !email) {
          const buyerIdentity = shopify.buyerIdentity?.value;
          customerId = buyerIdentity?.customer?.id ? String(buyerIdentity.customer.id) : null;
          email = buyerIdentity?.customer?.email || buyerIdentity?.email || null;
          if (email) email = String(email);
        }
      }
    } catch (e) {
      console.log('[THANK YOU PAGE] Error accessing global shopify:', e);
    }
  }

  // Build query params
  const params = new URLSearchParams();
  if (shop) params.append("shop", shop);
  if (orderId) params.append("orderId", orderId);
  if (orderNumber) params.append("orderNumber", orderNumber);
  if (customerId) params.append("customerId", customerId);
  if (email) params.append("customerEmail", email);

  console.log('[THANK YOU PAGE] Fetching referral link:', {
    shop,
    apiUrl: DIRECT_API_URL,
    orderId,
    orderNumber,
    customerId,
    email,
    params: params.toString(),
  });

  const response = await fetch(`${DIRECT_API_URL}${params.toString() ? `?${params}` : ''}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const rawData = await response.json();
  console.log('[THANK YOU PAGE] API response:', rawData);
  
  if (rawData.success && rawData.referralLink) {
    return {
      referralLink: String(rawData.referralLink),
      referralCode: String(rawData.referralCode || ''),
    };
  } else {
    throw new Error(rawData.error || "Failed to generate referral link");
  }
}
