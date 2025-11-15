import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { createSafeLink } from "../services/referral.server.js";
import { createShopifyDiscount } from "../services/discount.server.js";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

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

    // Find the referral code record
    const referralCodeRecord = await prisma.referralDiscountCode.findUnique({
      where: {
        referralCode_siteId: {
          referralCode,
          siteId: shop,
        },
      },
    });

    if (!referralCodeRecord) {
      throw new Error("Referral code not found");
    }

    // Check if discount exists in Shopify, create if missing
    let discountCode = referralCodeRecord.discountCode;
    let shopifyDiscountId = referralCodeRecord.shopifyDiscountId;

    if ((!discountCode || !shopifyDiscountId)) {
      try {
        // Try to get admin session for creating discounts
        const { admin } = await authenticate.admin(request);
        
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
          usageLimit: 1000,
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
        console.error("Failed to create discount in safe-link:", discountError);
        // If discount creation fails, still return the discount code from DB
        // (it might have been created elsewhere, or will be created later)
      }
    }

    // Create safe link
    const safeLink = await createSafeLink({ referralCode, shop });

    return new Response(
      JSON.stringify({
        success: true,
        oneTimeCode: safeLink.oneTimeCode,
        discountCode: discountCode || safeLink.discountCode, // Use newly created or existing
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

