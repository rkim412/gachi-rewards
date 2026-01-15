import { authenticate } from "../shopify.server.js";
import { queueWebhook } from "../services/webhook-queue.server.js";
import { findOrCreateReferralCode } from "../services/referral.server.js";

/**
 * Webhook handler for orders/create
 * Tracks referral conversions when orders are created
 * Automatically creates referral codes for new customers
 * 
 * NOTE: Shopify discount codes are NOT created here.
 * Discounts are created when someone USES a referral link (via /api/safe-link)
 * 
 * Topic: orders/create
 * URI: /webhooks/orders/create
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
    // Use authenticate.webhook for proper HMAC verification and payload parsing
    const { topic, shop, payload } = await authenticate.webhook(request);

    // Quick operation: Create referral code for new customers
    // This ensures every customer gets a referral code they can share
    if (payload.customer?.id || payload.email) {
      try {
        const customerId = payload.customer?.id 
          ? String(payload.customer.id)
          : `guest-${payload.email || payload.id}`;
        const customerEmail = payload.email || `guest-${payload.id}@temp.com`;

        // Find or create referral code (no discount code needed - that happens on safe-link)
        await findOrCreateReferralCode({
          shop,
          storefrontUserId: customerId,
          email: customerEmail,
        });

        console.log(`[WEBHOOK] Created/found referral code for customer ${customerId}`);
      } catch (referralError) {
        // Log but don't fail - referral code creation is not critical
        console.warn(`[WEBHOOK] Failed to create referral code:`, referralError.message);
      }
    }

    // Queue webhook for async processing (Shopify best practice)
    // This ensures fast response (< 5 seconds) while processing can take longer
    // Heavy operations like referral tracking happen here
    try {
      await queueWebhook(topic, shop, payload);
    } catch (queueError) {
      // Log error but still return 200 to prevent Shopify retries
      console.error(`[WEBHOOK ERROR] Failed to queue webhook:`, queueError.message);
    }

    // Return 200 OK immediately (Shopify best practice)
    return new Response(null, { status: 200 });
  } catch (error) {
    // If it's an authentication error, return 401 so Shopify knows to retry
    if (error.message?.includes('Unauthorized') || 
        error.message?.includes('401') || 
        error.name === 'UnauthorizedError' ||
        (error instanceof Response && error.status === 401)) {
      console.error("[WEBHOOK ERROR] Authentication failed:", error.message);
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Log error but return 200 for other errors to prevent Shopify from retrying
    console.error("[WEBHOOK ERROR] Processing failed:", error.message);
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
