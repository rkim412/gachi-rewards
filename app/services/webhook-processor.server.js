import { createReferralJoin, markSafeLinkUsed, findOrCreateReferralCode } from "./referral.server.js";
import { createShopifyDiscount } from "./discount.server.js";
import prisma from "../db.server.js";

/**
 * Webhook Processor
 * Processes webhooks synchronously
 * Handles the actual business logic for webhook events
 */

/**
 * Process an orders/create webhook
 * @param {string} shop - Shop domain
 * @param {object} order - Order payload from webhook
 * @returns {Promise<void>}
 */
async function processOrdersCreate(shop, order) {
  // ============================================
  // AUTO-CREATE REFERRAL CODE FOR NEW CUSTOMERS
  // ============================================
  if (order.customer?.id || order.email) {
    try {
      // Convert customer ID to string (Shopify sends it as a number)
      const customerId = order.customer?.id 
        ? String(order.customer.id)  // Convert number to string
        : `guest-${order.email || order.id}`;
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
            // Note: createShopifyDiscount requires a request object with admin session
            // Webhooks don't have admin access, so this will likely fail
            // We'll skip this for now and let the Thank You page handle it
            console.log(`Referral code ${referralCodeRecord.referralCode} created for customer ${customerEmail}. Discount will be created on Thank You page.`);
          } catch (discountError) {
            // Expected: Webhooks don't have admin access, so discount creation fails
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
  // TRACK REFERRAL CONVERSIONS
  // ============================================
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
        refereeStorefrontUserId: order.customer?.id ? String(order.customer.id) : null,
        discountCode,
        orderTotal: parseFloat(order.total_price),
        discountAmount,
      });

      console.log(`Referral join created for order ${order.id}`);
    } catch (error) {
      // Log error but don't fail webhook
      console.error(`Error creating referral join:`, error);
    }
  }
}

/**
 * Process a webhook directly (synchronously)
 * @param {object} queueRecord - Webhook record with topic, shop, and payload
 * @returns {Promise<void>}
 */
export async function processWebhook(queueRecord) {
  const { topic, shop, payload } = queueRecord;

  try {
    // Parse payload (if it's a string)
    const payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;

    // Route to appropriate processor based on topic
    switch (topic) {
      case "orders/create":
        await processOrdersCreate(shop, payloadObj);
        break;

      case "app/uninstalled":
        // Handle app uninstall
        console.log(`App uninstalled from ${shop}`);
        // Add cleanup logic here if needed
        break;

      case "app/scopes_update":
        // Handle scopes update
        console.log(`Scopes updated for ${shop}`);
        // Add scopes update logic here if needed
        break;

      case "customers/data_request":
      case "customers/redact":
      case "shop/redact":
        // Compliance webhooks are handled separately
        console.log(`Compliance webhook ${topic} for ${shop}`);
        break;

      default:
        console.log(`Unknown webhook topic: ${topic} for ${shop}`);
    }

    console.log(`[WEBHOOK PROCESSOR] Successfully processed webhook (${topic}) for ${shop}`);
  } catch (error) {
    console.error(`[WEBHOOK PROCESSOR] Failed to process webhook:`, error);
    throw error; // Re-throw so caller knows it failed
  }
}

