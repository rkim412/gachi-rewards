import { queueWebhook } from "../services/webhook-queue.server.js";
import crypto from "crypto";

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
  console.log(`[WEBHOOK DEBUG] Incoming webhook request:`, {
    method: request.method,
    url: request.url,
    hasBody: !!request.body,
    bodyUsed: request.bodyUsed,
    headers: {
      'x-shopify-topic': request.headers.get('x-shopify-topic'),
      'x-shopify-shop-domain': request.headers.get('x-shopify-shop-domain'),
      'x-shopify-hmac-sha256': request.headers.get('x-shopify-hmac-sha256') ? 'present' : 'missing',
      'content-type': request.headers.get('content-type'),
      'content-length': request.headers.get('content-length'),
    },
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
    // CRITICAL: Read body as raw bytes for HMAC verification
    // The Shopify library needs the exact raw body bytes, not parsed JSON
    // In development, React Router may parse the body, so we need to handle this carefully
    
    let bodyBytes;
    let shop, topic, payload;
    
    // Try to read body as ArrayBuffer to get raw bytes
    if (request.bodyUsed) {
      console.error("[WEBHOOK ERROR] Request body already consumed!");
      return new Response("Internal Server Error: Body already consumed", { status: 500 });
    }
    
    // Clone request to preserve original body stream
    const clonedRequest = request.clone();
    
    // Read body as ArrayBuffer (raw bytes)
    const bodyArrayBuffer = await clonedRequest.arrayBuffer();
    bodyBytes = Buffer.from(bodyArrayBuffer);
    
    console.log(`[WEBHOOK DEBUG] Read body as raw bytes, length: ${bodyBytes.length}`);
    
    // Get HMAC from header
    const receivedHmac = request.headers.get('x-shopify-hmac-sha256');
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    
    if (!receivedHmac || !apiSecret) {
      console.error("[WEBHOOK ERROR] Missing HMAC header or API secret");
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Calculate expected HMAC
    const expectedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(bodyBytes)
      .digest('base64');
    
    // Verify HMAC
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(receivedHmac),
        Buffer.from(expectedHmac)
      );
    } catch (error) {
      console.error("[WEBHOOK ERROR] HMAC comparison error:", error);
      isValid = false;
    }
    
    // Development mode: Allow webhooks to proceed even if HMAC fails
    // This is a workaround for React Router dev server body parsing issues
    // In production (Vercel), the api/index.js handler uses raw-body to get true raw bytes
    const devMode = process.env.NODE_ENV === 'development';
    
    if (!isValid) {
      console.error("[WEBHOOK ERROR] HMAC verification failed!");
      console.error("[WEBHOOK ERROR] Received:", receivedHmac.substring(0, 30) + '...');
      console.error("[WEBHOOK ERROR] Expected:", expectedHmac.substring(0, 30) + '...');
      
      if (devMode) {
        console.warn("[WEBHOOK WARNING] DEV MODE: Bypassing HMAC verification");
        console.warn("[WEBHOOK WARNING] React Router dev server transforms body, causing HMAC mismatch");
        console.warn("[WEBHOOK WARNING] In production (Vercel), HMAC verification will be enforced");
        // Continue processing in dev mode - this is expected behavior
        isValid = true; // Allow to proceed
      } else {
        console.error("[WEBHOOK ERROR] Production mode - HMAC verification required");
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.log(`[WEBHOOK DEBUG] HMAC verification successful!`);
    }
    
    // Parse payload from raw bytes
    try {
      payload = JSON.parse(bodyBytes.toString('utf8'));
      shop = request.headers.get('x-shopify-shop-domain');
      topic = request.headers.get('x-shopify-topic');
      
      console.log(`[WEBHOOK DEBUG] Parsed webhook payload for ${shop}, topic: ${topic}`);
    } catch (parseError) {
      console.error("[WEBHOOK ERROR] Failed to parse payload:", parseError);
      return new Response("Bad Request", { status: 400 });
    }
    
    console.log(`[WEBHOOK] Received ${topic} webhook for ${shop}`, {
      orderId: payload?.id,
      orderNumber: payload?.order_number,
      customerEmail: payload?.email,
    });

    // Step 2: Queue webhook for async processing (Shopify best practice)
    // This ensures fast response (< 5 seconds) while processing can take longer
    try {
      const queueResult = await queueWebhook(topic, shop, payload);
      console.log(`[WEBHOOK] Queued webhook ${queueResult.id} for ${topic} from ${shop}`);
    } catch (queueError) {
      // Log error but still return 200 to prevent Shopify retries
      // The webhook will be lost, but that's better than infinite retries
      console.error(`[WEBHOOK ERROR] Failed to queue webhook:`, queueError);
      // In production, you might want to send to a dead letter queue or alert
    }

    // Step 3: Return 200 OK immediately (Shopify best practice)
    // Processing happens asynchronously via background worker
    return new Response(null, { status: 200 });
  } catch (error) {
    // Log detailed error information
    console.error("[WEBHOOK ERROR] Raw error object:", error);
    console.error("[WEBHOOK ERROR] Webhook processing failed:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      requestMethod: request.method,
      requestUrl: request.url,
      bodyUsed: request.bodyUsed,
      hasShopifyHeaders: {
        topic: !!request.headers.get('x-shopify-topic'),
        shop: !!request.headers.get('x-shopify-shop-domain'),
        hmac: !!request.headers.get('x-shopify-hmac-sha256'),
      },
      hmacHeader: request.headers.get('x-shopify-hmac-sha256')?.substring(0, 20) || 'missing',
      isAuthError: error.message?.includes('Unauthorized') || 
                   error.message?.includes('401') || 
                   error.name === 'UnauthorizedError' ||
                   (error instanceof Response && error.status === 401),
      hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
      apiSecretLength: process.env.SHOPIFY_API_SECRET?.length || 0,
      hint: "HMAC verification failed - ensure raw body stream is preserved"
    });
    
    // If it's an authentication error, return 401 so Shopify knows to retry
    if (error.message?.includes('Unauthorized') || 
        error.message?.includes('401') || 
        error.name === 'UnauthorizedError' ||
        (error instanceof Response && error.status === 401)) {
      console.error("[WEBHOOK ERROR] Authentication failed - HMAC verification failed. Returning 401");
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
