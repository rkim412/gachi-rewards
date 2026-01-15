import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

/**
 * GDPR Compliance Webhook Handler
 * Handles mandatory webhook topics required for Shopify apps:
 * - customers/data_request: Customer requests to view their stored data
 * - customers/redact: Customer requests to delete their data
 * - shop/redact: Shop requests to delete shop data
 * 
 * These webhooks are mandatory for public apps (GDPR compliance)
 */

/**
 * Loader for GET requests - webhooks only accept POST
 * Prevents routing errors when someone visits the webhook URL in a browser
 */
export const loader = async ({ request }) => {
  return new Response(
    JSON.stringify({ 
      error: "Webhooks only accept POST requests",
      message: "This endpoint is for Shopify webhook delivery only. Use POST method."
    }),
    { 
      status: 405, // Method Not Allowed
      headers: { "Content-Type": "application/json" }
    }
  );
};

export const action = async ({ request }) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    
    console.log(`[COMPLIANCE WEBHOOK] Received ${topic} webhook for ${shop}`);

    switch (topic) {
      case "customers/data_request":
        // Customer has requested to view their stored data
        // You should provide a way for customers to access their data
        // For now, we'll log the request
        console.log(`[GDPR] Data request for customer:`, {
          customerId: payload?.customer?.id,
          shop,
          requestedAt: payload?.requested_at,
        });
        
        // TODO: Implement data export functionality
        // You should provide a way for customers to download their data
        // This could be via email, a secure download link, etc.
        break;

      case "customers/redact":
        // Customer has requested to delete their data
        // We must delete all customer data from our database
        const customerId = payload?.customer?.id;
        const customerEmail = payload?.customer?.email;
        
        console.log(`[GDPR] Redact request for customer:`, {
          customerId,
          customerEmail,
          shop,
        });

        if (customerId || customerEmail) {
          try {
            // Delete customer's referral code and related data
            // Find the customer's StorefrontUser record
            const whereClause = {
              siteId: shop,
            };
            
            // Build OR condition for customer lookup
            const orConditions = [];
            if (customerId) {
              orConditions.push({ shopifyCustomerId: `gid://shopify/Customer/${customerId}` });
            }
            if (customerEmail) {
              orConditions.push({ email: customerEmail });
            }
            
            if (orConditions.length > 0) {
              whereClause.OR = orConditions;
            }
            
            const storefrontUser = await prisma.storefrontUser.findFirst({
              where: whereClause,
              include: {
                referralCode: {
                  include: {
                    referralJoins: true,
                    discountCodes: true,
                  },
                },
              },
            });

            if (storefrontUser) {
              // Delete referral joins where this customer was the referee
              await prisma.referralJoin.deleteMany({
                where: {
                  siteId: shop,
                  refereeEmail: storefrontUser.email,
                },
              });

              // Delete referral joins where this customer was the referrer
              if (storefrontUser.referralCode) {
                await prisma.referralJoin.deleteMany({
                  where: {
                    referralCodeId: storefrontUser.referralCode.id,
                  },
                });

                // Delete discount codes
                await prisma.referralDiscountCode.deleteMany({
                  where: {
                    referralCodeId: storefrontUser.referralCode.id,
                  },
                });

                // Delete referral code
                await prisma.referralCode.delete({
                  where: {
                    id: storefrontUser.referralCode.id,
                  },
                });
              }

              // Delete storefront user
              await prisma.storefrontUser.delete({
                where: {
                  id: storefrontUser.id,
                },
              });

              console.log(`[GDPR] Successfully deleted all data for customer ${customerEmail || customerId}`);
            } else {
              console.log(`[GDPR] No customer data found to delete for ${customerEmail || customerId}`);
            }
          } catch (error) {
            console.error(`[GDPR] Error deleting customer data:`, error);
            // Still return 200 - we've acknowledged the request
          }
        }
        break;

      case "shop/redact":
        // Shop has requested to delete all shop data
        // This happens when a shop uninstalls the app or requests data deletion
        console.log(`[GDPR] Shop redact request for:`, {
          shop,
          shopId: payload?.shop_id,
        });

        try {
          // Delete all shop-specific data
          // Note: We keep Session records for app functionality, but delete referral data
          
          // Delete all referral joins for this shop
          await prisma.referralJoin.deleteMany({
            where: { siteId: shop },
          });

          // Delete all discount codes for this shop (via referral codes)
          const referralCodes = await prisma.referralCode.findMany({
            where: { siteId: shop },
            select: { id: true },
          });
          
          if (referralCodes.length > 0) {
            await prisma.referralDiscountCode.deleteMany({
              where: {
                referralCodeId: {
                  in: referralCodes.map(rc => rc.id),
                },
              },
            });
          }

          // Delete all referral codes for this shop
          await prisma.referralCode.deleteMany({
            where: { siteId: shop },
          });

          // Delete all storefront users for this shop
          await prisma.storefrontUser.deleteMany({
            where: { siteId: shop },
          });

          // Delete shop config
          await prisma.referralConfig.deleteMany({
            where: { siteId: shop },
          });

          console.log(`[GDPR] Successfully deleted all shop data for ${shop}`);
        } catch (error) {
          console.error(`[GDPR] Error deleting shop data:`, error);
          // Still return 200 - we've acknowledged the request
        }
        break;

      default:
        console.warn(`[COMPLIANCE WEBHOOK] Unhandled topic: ${topic}`);
    }

    // Always return 200 to acknowledge receipt
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("[COMPLIANCE WEBHOOK ERROR] Webhook processing failed:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    // Return 200 to prevent Shopify from retrying
    return new Response(null, { status: 200 });
  }
};

/**
 * Default component - required by React Router v7
 */
export default function ComplianceWebhook() {
  return null;
}
