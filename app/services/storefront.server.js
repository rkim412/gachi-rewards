import prisma from "../db.server.js";

/**
 * Get Storefront API client for a shop
 * Uses environment variable for Storefront API access token or falls back to session
 * @param {string} shop - Shop domain (e.g., "store.myshopify.com")
 * @returns {Promise<Object>} - Storefront API client with request method
 */
export async function getStorefrontApiClient(shop) {
  // Try to get Storefront API access token from environment variable first
  // This should be set per shop or use a shared token
  let storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  // If no environment variable, try to get from session (fallback)
  if (!storefrontAccessToken) {
    const session = await prisma.session.findFirst({
      where: { shop },
      orderBy: { expires: 'desc' },
    });

    if (session) {
      storefrontAccessToken = session.accessToken;
    }
  }

  if (!storefrontAccessToken) {
    throw new Error(`No Storefront API access token found for shop: ${shop}. Please set SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variable.`);
  }

  const storefrontApiVersion = "2025-10";
  const storefrontApiUrl = `https://${shop}/api/${storefrontApiVersion}/graphql.json`;

  return {
    request: async (query, options = {}) => {
      const response = await fetch(storefrontApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        },
        body: JSON.stringify({
          query,
          variables: options.variables || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Storefront API request failed: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    },
  };
}
