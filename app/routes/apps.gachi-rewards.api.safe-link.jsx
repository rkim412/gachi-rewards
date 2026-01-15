import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { createDiscountCode } from "../services/referral.server.js";
import { createAppDiscount } from "../services/discount.server.js";
import { getAdminContextForShop } from "../services/admin.server.js";
import prisma from "../db.server.js";

/**
 * App Proxy route for creating one-time discount codes
 * Called by storefront script when user clicks ?ref=CODE
 * 
 * Creates a REAL Shopify discount code backed by our Discount Function
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
    const referralCodeRecord = await prisma.referralCode.findUnique({
      where: {
        code_siteId: {
          code: referralCode,
          siteId: shop,
        },
      },
      include: {
        referrer: true,
      },
    });

    if (!referralCodeRecord) {
      throw new Error("Referral code not found");
    }

    // Get shop config for discount percentage
    const config = await prisma.referralConfig.findUnique({
      where: { siteId: shop },
    });

    const discountPercentage = config?.amount || 10.0;
    const discountType = config?.type || "percentage";

    // Create discount code record (generates a unique discount code string)
    const discountCodeRecord = await createDiscountCode({ referralCode, shop });

    // Try to create a REAL Shopify App discount backed by our Function
    let shopifyDiscountId = null;
    try {
      // Get admin context for the shop
      const adminContext = await getAdminContextForShop(shop);
      
      if (adminContext?.admin) {
        const discount = await createAppDiscount({
          admin: adminContext.admin,
          code: discountCodeRecord.discountCode,
          title: `Referral from ${referralCodeRecord.referrer?.email || referralCode}`,
          endsAt: discountCodeRecord.expiresAt,
          usageLimit: 1, // One-time use
          metafields: [
            {
              namespace: "$app:referral",
              key: "referral_code",
              type: "single_line_text_field",
              value: referralCode,
            },
            {
              namespace: "$app:referral",
              key: "discount_percentage",
              type: "number_decimal",
              value: discountPercentage.toString(),
            },
            {
              namespace: "$app:referral",
              key: "discount_type",
              type: "single_line_text_field",
              value: discountType,
            },
          ],
        });

        if (discount) {
          shopifyDiscountId = discount.id;
          
          // Update the discount code record with Shopify discount ID
          await prisma.referralDiscountCode.update({
            where: { id: discountCodeRecord.id },
            data: { shopifyDiscountId: discount.id },
          });

          console.log(`[SAFE-LINK] Created Shopify App discount: ${discount.code} (${discount.id})`);
        }
      } else {
        console.warn(`[SAFE-LINK] No admin context for shop ${shop}, discount code will work via Function fallback`);
      }
    } catch (discountError) {
      // Log but don't fail - the discount can still work via the Function reading cart attributes
      console.error(`[SAFE-LINK] Failed to create Shopify discount:`, discountError.message);
    }

    // Return Shopify discount code (for checkout)
    return new Response(
      JSON.stringify({
        success: true,
        shopifyDiscountCode: discountCodeRecord.discountCode, // Shopify discount code for checkout
        shopifyDiscountId, // GID if created successfully
        discountPercentage: discountPercentage, // For display/fallback
        discountType: discountType, // For display/fallback
        expiresAt: discountCodeRecord.expiresAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating discount code:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create discount code",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Also support POST requests
export const action = loader;
