import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";

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
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }

  return new Response();
};

/**
 * Default component - required by React Router v7
 */
export default function AppUninstalledWebhook() {
  return null;
}