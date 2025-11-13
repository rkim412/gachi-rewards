import crypto from "crypto";

/**
 * Verify App Proxy request signature
 * Shopify adds query parameters: shop, timestamp, signature, logged_in_customer_id, path_prefix
 * @param {Request} request - The incoming request
 * @returns {Promise<{shop: string, loggedInCustomerId: string|null, isValid: boolean}>}
 */
export async function verifyAppProxyRequest(request) {
  const url = new URL(request.url);
  
  // Extract query parameters added by Shopify
  const shop = url.searchParams.get("shop");
  const timestamp = url.searchParams.get("timestamp");
  const signature = url.searchParams.get("signature");
  const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");
  const pathPrefix = url.searchParams.get("path_prefix");

  if (!shop || !timestamp || !signature) {
    console.error("Missing App Proxy parameters:", { shop: !!shop, timestamp: !!timestamp, signature: !!signature });
    return { shop: null, loggedInCustomerId: null, isValid: false };
  }

  // Get app secret from environment
  const appSecret = process.env.SHOPIFY_API_SECRET;
  if (!appSecret) {
    console.error("SHOPIFY_API_SECRET not configured");
    return { shop, loggedInCustomerId, isValid: false };
  }

  // Reconstruct the query string (excluding signature)
  const queryParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key !== "signature") {
      queryParams.append(key, value);
    }
  });
  
  // Sort query params alphabetically
  const sortedParams = Array.from(queryParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // Create the message to verify
  const message = sortedParams;

  // Calculate HMAC
  const hmac = crypto
    .createHmac("sha256", appSecret)
    .update(message)
    .digest("hex");

  // Compare signatures (use timing-safe comparison)
  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hmac)
    );
  } catch (error) {
    // Signature length mismatch
    isValid = false;
  }

  // Also verify timestamp is recent (within 1 hour)
  const requestTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - requestTime);
  const isRecent = timeDiff < 3600; // 1 hour

  if (!isValid) {
    console.error("App Proxy signature mismatch", {
      shop,
      expectedHmac: hmac.substring(0, 10) + "...",
      receivedSignature: signature.substring(0, 10) + "...",
      message: sortedParams.substring(0, 100) + "...",
    });
  }

  if (!isRecent) {
    console.error("App Proxy timestamp too old", {
      shop,
      requestTime,
      currentTime,
      timeDiff,
    });
  }

  return {
    shop,
    loggedInCustomerId: loggedInCustomerId || null,
    isValid: isValid && isRecent,
  };
}

/**
 * Get shop domain from App Proxy request
 * @param {Request} request - The incoming request
 * @returns {string|null} - Shop domain or null
 */
export function getShopFromProxyRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.get("shop");
}

