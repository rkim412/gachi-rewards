import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { authenticate } from "../shopify.server.js";
import { findOrCreateReferralCode } from "../services/referral.server.js";
import { createShopifyDiscount } from "../services/discount.server.js";
import prisma from "../db.server.js";

/**
 * App Proxy route for generating referral codes
 * Called by Thank You page extension after purchase
 * 
 * URL: 
 * /apps/gachi-rewards/api/generate
 * Method: GET or POST
 * Authentication: App Proxy signature verification + Admin session
 */
export const loader = async ({ request }) => {
  try {
    // Verify App Proxy signature
    const { shop, loggedInCustomerId, isValid } = await verifyAppProxyRequest(request);
    
    if (!isValid) {
      console.error("Invalid App Proxy signature", {
        shop,
        loggedInCustomerId,
        requestUrl: new URL(request.url).toString().substring(0, 300),
        hint: "Check terminal logs for detailed signature mismatch information. Common causes: App Proxy URL mismatch, missing SHOPIFY_API_SECRET, or outdated tunnel URL in Partners Dashboard."
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request signature",
          hint: process.env.NODE_ENV === "development" 
            ? "Check terminal logs for details. In dev mode, signature verification may be bypassed if configured."
            : "Verify App Proxy URL in Partners Dashboard matches your current tunnel URL"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get order info from query params (passed by Thank You extension)
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    const queryCustomerId = url.searchParams.get("customerId");
    const customerEmail = url.searchParams.get("customerEmail");

    console.log(`[API GENERATE] Received request:`, {
      shop,
      orderId,
      queryCustomerId,
      loggedInCustomerId,
      customerEmail,
      allParams: Object.fromEntries(url.searchParams),
    });

    // Use loggedInCustomerId from App Proxy if available, otherwise use query param
    // For guest checkouts, generate a temporary ID if nothing is available
    let finalCustomerId = loggedInCustomerId || queryCustomerId;
    let finalCustomerEmail = customerEmail;
    
    // Normalize customer ID: Extract numeric ID from GID format if present
    // Shopify sends customer IDs as GIDs like "gid://shopify/Customer/9322001236199"
    // But we store them as just the number part "9322001236199"
    if (finalCustomerId && finalCustomerId.startsWith('gid://shopify/Customer/')) {
      finalCustomerId = finalCustomerId.replace('gid://shopify/Customer/', '');
      console.log(`[API GENERATE] Normalized customer ID from GID: ${finalCustomerId}`);
    }
    
    if (!finalCustomerId && !finalCustomerEmail && !orderId) {
      // Generate a temporary identifier based on shop and timestamp
      const tempId = `temp-${shop}-${Date.now()}`;
      finalCustomerId = tempId;
      finalCustomerEmail = `${tempId}@temp.com`;
    }

    // Try to get admin session for creating discounts (optional - will handle gracefully if fails)
    let admin = null;
    try {
      const authResult = await authenticate.admin(request);
      admin = authResult.admin;
    } catch (authError) {
      // Admin auth may fail for App Proxy requests - that's okay, we'll handle it
      console.warn("Admin authentication failed (expected for App Proxy):", authError.message);
    }

    // Find or create referral code
    // Use customerId if available, otherwise use email as identifier
    const storefrontUserId = finalCustomerId || `guest-${finalCustomerEmail || orderId || Date.now()}`;
    const email = finalCustomerEmail || `guest-${orderId || Date.now()}@temp.com`;
    
    console.log(`[API GENERATE] Finding/creating referral code:`, {
      shop,
      storefrontUserId,
      email,
    });
    
    const referralCodeRecord = await findOrCreateReferralCode({
      shop,
      storefrontUserId,
      email,
    });
    
    console.log(`[API GENERATE] Referral code result:`, {
      id: referralCodeRecord.id,
      referralCode: referralCodeRecord.referralCode,
      discountCode: referralCodeRecord.discountCode,
    });

    // If discount code doesn't exist yet, try to create it (requires admin)
    let discountCode = referralCodeRecord.discountCode;
    let shopifyDiscountId = referralCodeRecord.shopifyDiscountId;

    if ((!discountCode || !shopifyDiscountId) && admin) {
      try {
        // Get shop config for discount percentage
        const config = await prisma.referralConfig.findUnique({
          where: { siteId: shop },
        });

        const discountPercentage = config?.amount || 10.0;
        const discountCodeName = `GACHI-${referralCodeRecord.referralCode}`;

        // Create discount in Shopify (requires admin)
        const discount = await createShopifyDiscount({
          request,
          code: discountCodeName,
          percentageValue: discountPercentage,
          usageLimit: 1000, // Allow many uses
        });

        // Update referral code record with Shopify discount info
        await prisma.referralDiscountCode.update({
          where: { id: referralCodeRecord.id },
          data: {
            discountCode: discount.code,
            shopifyDiscountId: discount.id,
          },
        });

        discountCode = discount.code;
        shopifyDiscountId = discount.id;
      } catch (discountError) {
        console.error("Failed to create discount:", discountError);
        // Continue without discount code - referral code still works
      }
    }

    // Build referral link
    const shopDomain = shop.replace(".myshopify.com", "");
    const referralLink = `https://${shopDomain}.myshopify.com/?ref=${referralCodeRecord.referralCode}`;

    return new Response(
      JSON.stringify({
        success: true,
        referralCode: referralCodeRecord.referralCode,
        referralLink,
        discountCode,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating referral:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate referral code",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Also support POST requests
export const action = loader;

