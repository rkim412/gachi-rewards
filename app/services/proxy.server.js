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

  // Log all query parameters for debugging
  const allParams = {};
  url.searchParams.forEach((value, key) => {
    allParams[key] = key === "signature" ? `${value.substring(0, 10)}...` : value;
  });

  if (!shop || !timestamp || !signature) {
    console.error("Missing App Proxy parameters");
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

  // Development mode: allow bypassing signature verification (NOT for production!)
  const devMode = process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_PROXY === "true";
  
  if (!isValid) {
    console.error("App Proxy signature mismatch");
  }

  if (!isRecent) {
    console.error("App Proxy timestamp too old");
  }

  // In development mode, if signature fails but we have shop and timestamp, allow it
  // This helps when App Proxy URL in Partners Dashboard hasn't been updated yet
  let finalIsValid = isValid && isRecent;
  
  if (devMode && !isValid && shop && timestamp && isRecent) {
    console.warn("⚠️  DEV MODE: Bypassing App Proxy signature verification");
    finalIsValid = true; // Allow in dev mode if we have shop, timestamp, and it's recent
  }

  return {
    shop,
    loggedInCustomerId: loggedInCustomerId || null,
    isValid: finalIsValid,
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

