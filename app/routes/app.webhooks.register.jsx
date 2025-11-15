import { authenticate, registerWebhooks } from "../shopify.server.js";

/**
 * Admin route to manually register webhooks
 * Access: /app/webhooks/register
 * This will register all webhooks defined in shopify.app.toml
 * 
 * No admin API key needed - uses OAuth session from authenticate.admin()
 */
export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    if (!session) {
      console.error("[WEBHOOK REGISTRATION] No session found - authentication failed");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Unauthorized - no session found" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[WEBHOOK REGISTRATION] Registering webhooks for ${session.shop}...`);
    console.log(`[WEBHOOK REGISTRATION] Session ID: ${session.id}`);
    
    // Register webhooks using the built-in function
    // This reads webhooks from shopify.app.toml automatically
    await registerWebhooks({ session });
    
    console.log(`[WEBHOOK REGISTRATION] Successfully registered webhooks for ${session.shop}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Webhooks registered successfully",
      shop: session.shop,
      sessionId: session.id,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[WEBHOOK REGISTRATION ERROR] Failed to register webhooks:`, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.stack,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Default component - required by React Router v7
 * This route primarily returns JSON from the loader, but a component is required
 * for the route to be recognized by React Router's file-based routing.
 */
export default function WebhookRegister() {
  // This component is required but won't render since loader returns Response directly
  return null;
}

