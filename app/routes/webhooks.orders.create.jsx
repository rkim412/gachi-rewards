import { authenticate } from "../shopify.server.js";
import { createReferralJoin, markSafeLinkUsed, findOrCreateReferralCode } from "../services/referral.server.js";
import { createShopifyDiscount } from "../services/discount.server.js";
import prisma from "../db.server.js";

/**
 * Webhook handler for orders/create
 * Tracks referral conversions when orders are created
 * Automatically creates referral codes for new customers
 * 
 * Topic: orders/create
 * URI: /webhooks/orders/create
 */
export const action = async ({ request }) => {
  // Log immediately - BEFORE authentication to catch all requests
  // This will help diagnose if requests are reaching the server
  console.log(`[WEBHOOK DEBUG] Incoming webhook request:`, {
    method: request.method,
    url: request.url,
    hasBody: !!request.body,
    headers: {
      'x-shopify-topic': request.headers.get('x-shopify-topic'),
      'x-shopify-shop-domain': request.headers.get('x-shopify-shop-domain'),
      'x-shopify-hmac-sha256': request.headers.get('x-shopify-hmac-sha256') ? 'present' : 'missing',
      'content-type': request.headers.get('content-type'),
      'content-length': request.headers.get('content-length'),
    },
    // Check if API secret is available (don't log the actual value!)
    hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
    apiSecretLength: process.env.SHOPIFY_API_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  });

  // Check if SHOPIFY_API_SECRET is available
  if (!process.env.SHOPIFY_API_SECRET) {
    console.error("[WEBHOOK ERROR] SHOPIFY_API_SECRET is not set in environment variables");
    return new Response("Internal Server Error: Missing API secret", { status: 500 });
  }

  try {
    // Extract payload from authenticate.webhook() - don't call request.json() separately!
    console.log(`[WEBHOOK DEBUG] Attempting to authenticate webhook...`);
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(`[WEBHOOK DEBUG] Authentication successful for ${shop}`);
    
    console.log(`[WEBHOOK] Received ${topic} webhook for ${shop}`, {
      orderId: payload?.id,
      orderNumber: payload?.order_number,
      customerEmail: payload?.email,
    });

    if (topic === "orders/create") {
      const order = payload; // Use payload directly, not request.json()

      // ============================================
      // AUTO-CREATE REFERRAL CODE FOR NEW CUSTOMERS
      // ============================================
      // Automatically create referral code for any customer who makes a purchase
      if (order.customer?.id || order.email) {
        try {
          const customerId = order.customer?.id || `guest-${order.email || order.id}`;
          const customerEmail = order.email || `guest-${order.id}@temp.com`;

          // Find or create referral code for this customer
          const referralCodeRecord = await findOrCreateReferralCode({
            shop,
            storefrontUserId: customerId,
            email: customerEmail,
          });

          // If discount code doesn't exist yet, try to create it in Shopify
          // Note: Webhooks typically don't have admin access, so discount creation
          // will likely be deferred until the Thank You page loads (which has admin access)
          if (!referralCodeRecord.discountCode || !referralCodeRecord.shopifyDiscountId) {
            try {
              // Get shop config for discount percentage
              const config = await prisma.referralConfig.findUnique({
                where: { siteId: shop },
              });

              const discountPercentage = config?.amount || 10.0;
              const discountCodeName = `GACHI-${referralCodeRecord.referralCode}`;

              // Try to create discount - this will likely fail in webhook context
              // (webhooks don't have admin access), but that's okay.
              // The discount will be created when the Thank You page loads.
              try {
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

                console.log(`Auto-created referral code ${referralCodeRecord.referralCode} and discount for customer ${customerEmail}`);
              } catch (discountError) {
                // Expected: Webhooks don't have admin access, so discount creation fails
                // The discount will be created when the Thank You page loads (which has admin access via App Proxy)
                console.log(`Referral code ${referralCodeRecord.referralCode} created for customer ${customerEmail}. Discount will be created on Thank You page.`);
              }
            } catch (error) {
              // Log but don't fail - discount can be created later
              console.log(`Referral code created but discount creation skipped:`, error.message);
            }
          } else {
            console.log(`Customer ${customerEmail} already has referral code ${referralCodeRecord.referralCode}`);
          }
        } catch (error) {
          // Log but don't fail webhook - referral code creation is not critical for order processing
          console.error(`Error auto-creating referral code:`, error);
        }
      }

      // ============================================
      // TRACK REFERRAL CONVERSIONS (existing logic)
      // ============================================
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
    // Log detailed error information
    console.error("[WEBHOOK ERROR] Webhook processing failed:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      // Log request details for debugging
      requestMethod: request.method,
      requestUrl: request.url,
      hasShopifyHeaders: {
        topic: !!request.headers.get('x-shopify-topic'),
        shop: !!request.headers.get('x-shopify-shop-domain'),
        hmac: !!request.headers.get('x-shopify-hmac-sha256'),
      },
      // Log HMAC header details (first 20 chars only for security)
      hmacHeader: request.headers.get('x-shopify-hmac-sha256')?.substring(0, 20) || 'missing',
      // Check if this is an authentication error
      isAuthError: error.message?.includes('Unauthorized') || error.message?.includes('401') || error.name === 'UnauthorizedError',
      // Environment check
      hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
      apiSecretLength: process.env.SHOPIFY_API_SECRET?.length || 0,
    });
    
    // If it's an authentication error, return 401 so Shopify knows to retry
    // Otherwise return 200 to prevent infinite retries
    if (error.message?.includes('Unauthorized') || error.message?.includes('401') || error.name === 'UnauthorizedError') {
      console.error("[WEBHOOK ERROR] Authentication failed - returning 401");
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Return 200 for other errors to prevent Shopify from retrying
    return new Response(null, { status: 200 });
  }
};

/**
 * Default component - required by React Router v7 for route discovery
 * Webhooks use action for POST requests, but a component is required
 * for the route to be recognized by React Router's file-based routing.
 * This component will never render since webhooks are POST-only.
 */
export default function OrdersCreateWebhook() {
  return null;
}
