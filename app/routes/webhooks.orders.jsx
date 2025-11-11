import { authenticate } from "../shopify.server.js";
import { createReferralJoin, markSafeLinkUsed } from "../services/referral.server.js";
import prisma from "../db.server.js";

/**
 * Webhook handler for orders/create
 * Tracks referral conversions when orders are created
 * 
 * Topic: orders/create
 * URI: /webhooks/orders/create
 */
export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    if (topic === "orders/create") {
      const order = await request.json();

      // Extract referral information from order attributes or discount codes
      let referralCode = null;
      let discountCode = null;
      let discountAmount = null;

      // Check order attributes (set by storefront script)
      const refAttribute = order.note_attributes?.find(
        (attr) => attr.name === "gachi_ref"
      );
      const discountAttribute = order.note_attributes?.find(
        (attr) => attr.name === "gachi_discount_code"
      );

      if (refAttribute) {
        referralCode = refAttribute.value;
      }

      if (discountAttribute) {
        discountCode = discountAttribute.value;
      }

      // Also check discount codes applied
      if (order.discount_codes && order.discount_codes.length > 0) {
        const appliedDiscount = order.discount_codes[0];
        discountCode = appliedDiscount.code;

        // Try to extract referral code from discount code format: GACHI-ALICE123
        if (discountCode.startsWith("GACHI-")) {
          const extractedCode = discountCode.replace("GACHI-", "");
          // Only use if we don't already have a referral code
          if (!referralCode) {
            referralCode = extractedCode;
          }
        }
      }

      // Calculate discount amount
      if (order.total_discounts) {
        discountAmount = parseFloat(order.total_discounts);
      }

      // If we have a referral code, create referral join
      if (referralCode) {
        try {
          // Check if this is from a safe link (one-time code)
          const safeLink = await prisma.referralSafeLink.findFirst({
            where: {
              oneTimeCode: {
                contains: referralCode,
              },
              used: false,
            },
            include: {
              referralCode: true,
            },
          });

          if (safeLink) {
            // Use the actual referral code from the safe link
            referralCode = safeLink.referralCode.referralCode;
            // Mark safe link as used
            await markSafeLinkUsed(safeLink.oneTimeCode, order.id);
          }

          await createReferralJoin({
            shop,
            referralCode,
            orderId: order.id,
            orderNumber: order.order_number?.toString(),
            refereeEmail: order.email,
            refereeStorefrontUserId: order.customer?.id,
            discountCode,
            orderTotal: parseFloat(order.total_price),
            discountAmount,
          });

          console.log(`Referral join created for order ${order.id}`);
        } catch (error) {
          // Log error but don't fail webhook
          console.error(`Error creating referral join:`, error);
          // Continue processing - webhook should still return 200
        }
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 to prevent Shopify from retrying
    return new Response(null, { status: 200 });
  }
};

