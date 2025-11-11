import { json } from "react-router";
import { verifyAppProxyRequest } from "../../services/proxy.server.js";
import { authenticate } from "../../shopify.server.js";
import { findOrCreateReferralCode } from "../../services/referral.server.js";
import { createShopifyDiscount } from "../../services/discount.server.js";
import prisma from "../../db.server.js";

/**
 * App Proxy route for generating referral codes
 * Called by Thank You page extension after purchase
 * 
 * URL: /apps/gachi-rewards/api/generate
 * Method: GET or POST
 * Authentication: App Proxy signature verification + Admin session
 */
export const loader = async ({ request }) => {
  try {
    // Verify App Proxy signature
    const { shop, loggedInCustomerId, isValid } = await verifyAppProxyRequest(request);
    
    if (!isValid) {
      return json(
        { success: false, error: "Invalid request signature" },
        { status: 401 }
      );
    }

    // Get order info from query params (passed by Thank You extension)
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    const customerId = loggedInCustomerId || url.searchParams.get("customerId");
    const customerEmail = url.searchParams.get("customerEmail");

    if (!customerId) {
      return json(
        { success: false, error: "Customer ID required" },
        { status: 400 }
      );
    }

    // Get authenticated admin session for this shop
    const { admin, session } = await authenticate.admin(request);
    
    // Verify shop matches
    if (session.shop !== shop) {
      return json(
        { success: false, error: "Shop mismatch" },
        { status: 403 }
      );
    }

    // Find or create referral code
    const referralCodeRecord = await findOrCreateReferralCode({
      shop,
      storefrontUserId: customerId,
      email: customerEmail,
    });

    // If discount code doesn't exist yet, create it
    let discountCode = referralCodeRecord.discountCode;
    let shopifyDiscountId = referralCodeRecord.shopifyDiscountId;

    if (!discountCode || !shopifyDiscountId) {
      // Get shop config for discount percentage
      const config = await prisma.referralConfig.findUnique({
        where: { siteId: shop },
      });

      const discountPercentage = config?.amount || 10.0;
      const discountCodeName = `GACHI-${referralCodeRecord.referralCode}`;

      // Create discount in Shopify
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
    }

    // Build referral link
    const shopDomain = shop.replace(".myshopify.com", "");
    const referralLink = `https://${shopDomain}.myshopify.com/?ref=${referralCodeRecord.referralCode}`;

    return json({
      success: true,
      referralCode: referralCodeRecord.referralCode,
      referralLink,
      discountCode,
    });
  } catch (error) {
    console.error("Error generating referral:", error);
    return json(
      {
        success: false,
        error: error.message || "Failed to generate referral code",
      },
      { status: 500 }
    );
  }
};

// Also support POST requests
export const action = loader;

