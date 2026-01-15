import prisma from "../db.server.js";
import shopify from "../shopify.server.js";

/**
 * Get Admin API context for a shop (for async webhook processing)
 * This allows us to use admin.graphql in webhook processors without a request object
 * 
 * @param {string} shop - Shop domain (e.g., "store.myshopify.com")
 * @returns {Promise<{admin: AdminApiContext, session: Session} | null>} - Admin context and session, or null if no session
 */
export async function getAdminContextForShop(shop) {
  try {
    // Get the most recent valid session for this shop
    const sessionRecord = await prisma.session.findFirst({
      where: { 
        shop,
        expires: {
          gt: new Date(), // Only get non-expired sessions
        },
      },
      orderBy: { expires: 'desc' },
    });

    if (!sessionRecord) {
      console.warn(`[ADMIN CONTEXT] No valid session found for shop: ${shop}`);
      return null;
    }

    // Load the session using shopify's sessionStorage
    // This converts the Prisma record to a Session object that shopify-api expects
    const session = await shopify.sessionStorage.loadSession(sessionRecord.id);
    
    if (!session) {
      console.warn(`[ADMIN CONTEXT] Could not load session ${sessionRecord.id} for shop: ${shop}`);
      return null;
    }

    // Create admin GraphQL client using shopify's client factory
    // The shopify instance from shopifyApp() has a clients property
    // We use the graphql method to create an admin GraphQL client
    const admin = shopify.clients.graphql({
      session,
    });

    return {
      admin,
      session,
    };
  } catch (error) {
    console.error(`[ADMIN CONTEXT] Error getting admin context for shop ${shop}:`, error);
    return null;
  }
}
