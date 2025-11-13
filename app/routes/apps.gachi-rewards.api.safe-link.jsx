import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { createSafeLink } from "../services/referral.server.js";

/**
 * App Proxy route for creating safe links
 * Called by storefront script when user clicks ?ref=CODE
 * 
 * URL: /apps/gachi-rewards/api/safe-link
 * Method: GET or POST
 * Authentication: App Proxy signature verification
 */
export const loader = async ({ request }) => {
  try {
    // Verify App Proxy signature
    const { shop, isValid } = await verifyAppProxyRequest(request);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get referral code from query params or body
    const url = new URL(request.url);
    const referralCode = url.searchParams.get("referralCode");

    if (!referralCode || !shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing referralCode or shop" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create safe link
    const safeLink = await createSafeLink({ referralCode, shop });

    return new Response(
      JSON.stringify({
        success: true,
        oneTimeCode: safeLink.oneTimeCode,
        discountCode: safeLink.discountCode,
        expiresAt: safeLink.expiresAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating safe link:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create safe link",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Also support POST requests
export const action = loader;

