import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { findOrCreateReferralCode } from "../services/referral.server.js";

// CORS headers required for checkout UI extensions
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * App Proxy route for generating referral codes
 * Called by Thank You page extension after purchase
 * 
 * This ONLY returns the customer's unique referral code.
 * Shopify discount codes are created when someone USES a referral link (via /api/safe-link)
 * 
 * URL: /apps/gachi-rewards/api/generate
 * Method: GET or POST
 * 
 * DIRECT URL MODE: For password-protected stores, the extension calls this
 * endpoint directly (bypassing app proxy). In this case, signature verification
 * is skipped and shop is read from query params.
 */
export const loader = async ({ request }) => {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const url = new URL(request.url);
    
    // Check if this is a direct request (has shop param but no signature)
    // Direct requests come from checkout extensions on password-protected stores
    const hasSignature = url.searchParams.has("signature");
    const queryShop = url.searchParams.get("shop");
    
    let shop = null;
    let loggedInCustomerId = null;
    
    if (hasSignature) {
      // App Proxy request - verify signature
      const proxyResult = await verifyAppProxyRequest(request);
      
      if (!proxyResult.isValid) {
        console.error("Invalid App Proxy signature", {
          shop: proxyResult.shop,
          loggedInCustomerId: proxyResult.loggedInCustomerId,
          requestUrl: url.toString().substring(0, 300),
        });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid request signature",
          }),
          { status: 401, headers: corsHeaders }
        );
      }
      
      shop = proxyResult.shop;
      loggedInCustomerId = proxyResult.loggedInCustomerId;
    } else if (queryShop) {
      // Direct request - skip signature verification
      // This is used by checkout extensions on password-protected stores
      console.log('[API GENERATE] Direct request (no signature), using shop from query:', queryShop);
      shop = queryShop;
    }

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop parameter required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get order info from query params (passed by Thank You extension)
    const orderId = url.searchParams.get("orderId");
    const queryCustomerId = url.searchParams.get("customerId");
    const customerEmail = url.searchParams.get("customerEmail");

    // Use loggedInCustomerId from App Proxy if available, otherwise use query param
    // For guest checkouts, generate a temporary ID if nothing is available
    let finalCustomerId = loggedInCustomerId || queryCustomerId;
    let finalCustomerEmail = customerEmail;
    
    // Normalize customer ID: Extract numeric ID from GID format if present
    // Shopify sends customer IDs as GIDs like "gid://shopify/Customer/9322001236199"
    // But we store them as just the number part "9322001236199"
    if (finalCustomerId) {
      if (finalCustomerId.startsWith('gid://shopify/Customer/')) {
        finalCustomerId = finalCustomerId.replace('gid://shopify/Customer/', '');
        console.log(`[API GENERATE] Normalized customer ID from GID: ${finalCustomerId}`);
      } else {
        // Ensure it's a string (in case it's a number)
        finalCustomerId = String(finalCustomerId);
        console.log(`[API GENERATE] Using customer ID as-is (normalized to string): ${finalCustomerId}`);
      }
    }
    
    if (!finalCustomerId && !finalCustomerEmail && !orderId) {
      // Generate a temporary identifier based on shop and timestamp
      const tempId = `temp-${shop}-${Date.now()}`;
      finalCustomerId = tempId;
      finalCustomerEmail = `${tempId}@temp.com`;
    }

    // Find or create referral code
    // Use customerId if available, otherwise use email as identifier
    const storefrontUserId = finalCustomerId || `guest-${finalCustomerEmail || orderId || Date.now()}`;
    const email = finalCustomerEmail || `guest-${orderId || Date.now()}@temp.com`;
    
    const referralCodeRecord = await findOrCreateReferralCode({
      shop,
      storefrontUserId,
      email,
    });

    // Build referral link - use the 'code' field from ReferralCode model
    const shopDomain = shop.replace(".myshopify.com", "");
    const referralLink = `https://${shopDomain}.myshopify.com/?ref=${referralCodeRecord.code}`;

    return new Response(
      JSON.stringify({
        success: true,
        referralCode: referralCodeRecord.code, // What customer shares (for thank you page)
        customerReferralCode: referralCodeRecord.code, // Alias for compatibility
        referralLink,
        // NOTE: No shopifyDiscountCode returned - discounts are created when someone USES the link
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error generating referral:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate referral code",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

// Also support POST requests
export const action = loader;
