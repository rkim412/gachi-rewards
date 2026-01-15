import { createReferralJoin, markDiscountCodeUsed, findOrCreateReferralCode } from "./referral.server.js";
import prisma from "../db.server.js";

/**
 * Webhook Processor
 * Processes webhooks synchronously
 * Handles the actual business logic for webhook events
 * 
 * NOTE: Shopify discount codes are NOT created here.
 * Discounts are created when someone USES a referral link (via /api/safe-link)
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
        ? String(order.customer.id)
        : `guest-${order.email || order.id}`;
      const customerEmail = order.email || `guest-${order.id}@temp.com`;

      // Find or create referral code for this customer
      // NOTE: No Shopify discount is created here - that happens when someone USES the referral link
      await findOrCreateReferralCode({
        shop,
        storefrontUserId: customerId,
        email: customerEmail,
      });

      console.log(`[WEBHOOK PROCESSOR] Created/found referral code for customer ${customerId}`);
    } catch (error) {
      // Log but don't fail webhook - referral code creation is not critical for order processing
      console.error(`[WEBHOOK PROCESSOR] Error auto-creating referral code:`, error);
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
    (attr) => attr.name === "referral_ref"
  );
  const discountAttribute = order.note_attributes?.find(
    (attr) => attr.name === "referral_shopify_discount_code"
  );

  if (refAttribute) {
    referralCode = refAttribute.value;
  }

  if (discountAttribute) {
    discountCode = discountAttribute.value;
  }

  // Also check discount codes applied (most reliable source for Discount Functions)
  if (order.discount_codes && order.discount_codes.length > 0) {
    const appliedDiscount = order.discount_codes[0];
    discountCode = appliedDiscount.code;

    // Try to extract referral code from discount code format
    // Format: GACHI-ALICE123 (main code) or GACHI-ALICE123-ABC1 (one-time discount)
    // Extract just the referral code part (first segment after GACHI-)
    if (discountCode.startsWith("GACHI-")) {
      const parts = discountCode.replace("GACHI-", "").split("-");
      const extractedCode = parts[0]; // Get first part (ALICE123)
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

  // If we have a referral code or discount code, create referral join
  if (referralCode || discountCode) {
    try {
      let discountCodeRecord = null;
      
      // First, try to find discount code record by code (most reliable - this is what was applied at checkout)
      if (discountCode) {
        discountCodeRecord = await prisma.referralDiscountCode.findFirst({
          where: {
            code: discountCode,
            used: false,
          },
          include: {
            referralCode: true,
          },
        });

        if (discountCodeRecord) {
          // Use the actual referral code from the discount code record
          referralCode = discountCodeRecord.referralCode.code;
          // Mark discount code as used
          await markDiscountCodeUsed(discountCodeRecord.oneTimeCode, order.id);
        }
      }

      // If no discount code record found by code, try by referral code (legacy/fallback)
      if (!discountCodeRecord && referralCode) {
        discountCodeRecord = await prisma.referralDiscountCode.findFirst({
          where: {
            referralCode: {
              code: referralCode,
            },
            used: false,
          },
          include: {
            referralCode: true,
          },
        });

        if (discountCodeRecord) {
          // Mark discount code as used
          await markDiscountCodeUsed(discountCodeRecord.oneTimeCode, order.id);
        }
      }

      // If we still don't have a referral code but have a discount code, try to extract it
      // Format: GACHI-ALICE123-ABC1 -> extract ALICE123 (first part after GACHI-)
      if (!referralCode && discountCode && discountCode.startsWith("GACHI-")) {
        const parts = discountCode.replace("GACHI-", "").split("-");
        if (parts.length >= 1) {
          referralCode = parts[0];
        }
      }

      // Ensure we have a referral code before creating join
      if (!referralCode) {
        return;
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
  const { topic, siteId, payload } = queueRecord;
  const shop = siteId; // siteId is the shop domain string

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
        // Add cleanup logic here if needed
        break;

      case "app/scopes_update":
        // Handle scopes update
        // Add scopes update logic here if needed
        break;

      case "customers/data_request":
      case "customers/redact":
      case "shop/redact":
        // Compliance webhooks are handled separately
        break;

      default:
        console.warn(`Unknown webhook topic: ${topic} for ${shop}`);
    }
  } catch (error) {
    console.error(`[WEBHOOK PROCESSOR] Failed to process webhook:`, error);
    throw error; // Re-throw so caller knows it failed
  }
}
