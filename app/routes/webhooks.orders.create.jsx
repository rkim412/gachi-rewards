import { authenticate } from "../shopify.server.js";
import { processWebhook } from "../services/webhook-processor.server.js";

/**
 * Webhook handler for orders/create
 * Tracks referral conversions when orders are created
 * Automatically creates referral codes for new customers
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
    // Step 1: Authenticate webhook quickly (HMAC verification)
    // This is critical - must happen before any processing
    // Following Shopify best practices: https://shopify.dev/docs/apps/build/webhooks/subscribe/https
    console.log(`[WEBHOOK DEBUG] Attempting to authenticate webhook...`);
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(`[WEBHOOK DEBUG] Authentication successful for ${shop}`);
    
    console.log(`[WEBHOOK] Received ${topic} webhook for ${shop}`, {
      orderId: payload?.id,
      orderNumber: payload?.order_number,
      customerEmail: payload?.email,
    });

    // Step 2: Process webhook directly (synchronously)
    // Create a queue-like object for the processor function
    const queueRecord = {
      id: 0, // Not used for direct processing
      topic,
      shop,
      payload: JSON.stringify(payload),
    };

    try {
      await processWebhook(queueRecord);
      console.log(`[WEBHOOK] Successfully processed ${topic} webhook for ${shop}`);
    } catch (processError) {
      // Log error but don't fail the webhook response
      // Shopify will retry if we return non-200
      console.error(`[WEBHOOK ERROR] Failed to process webhook:`, processError);
      // Continue to return 200 to prevent infinite retries for processing errors
    }

    // Step 3: Return 200 OK
    return new Response(null, { status: 200 });
  } catch (error) {
    // Log detailed error information
    console.error("[WEBHOOK ERROR] Raw error object:", error);
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
