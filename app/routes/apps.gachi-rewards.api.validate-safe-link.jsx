import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { findReferralBySafeLink } from "../services/referral.server.js";
import prisma from "../db.server.js";

/**
 * App Proxy route for validating safe links
 * Called by Discount Function to validate one-time codes
 * 
 * URL: /apps/gachi-rewards/api/validate-safe-link
 * Method: GET or POST
 * Authentication: App Proxy signature verification or API key
 */
export const loader = async ({ request }) => {
  try {
    // Verify App Proxy signature (or use API key for Discount Function)
    const { shop, isValid } = await verifyAppProxyRequest(request);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const oneTimeCode = url.searchParams.get("oneTimeCode");

    if (!oneTimeCode || !shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing oneTimeCode or shop" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find and validate safe link
    const referralCodeRecord = await findReferralBySafeLink(oneTimeCode);

    if (!referralCodeRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          error: "Invalid or expired safe link",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get shop config for discount percentage
    const config = await prisma.referralConfig.findUnique({
      where: { siteId: shop },
    });

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        discountPercentage: config?.amount || 10.0,
        discountType: config?.type || "percentage",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating safe link:", error);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: error.message || "Failed to validate safe link",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Also support POST requests
export const action = loader;





