import { verifyAppProxyRequest } from "../services/proxy.server.js";
import { getStorefrontApiClient } from "../services/storefront.server.js";

/**
 * App Proxy route for setting cart metafields
 * Called by storefront script after safe link is created
 * 
 * URL: /apps/gachi-rewards/api/set-cart-metafields
 * Method: POST
 * Authentication: App Proxy signature verification
 */
export const action = async ({ request }) => {
  try {
    // Verify App Proxy signature
    const { shop, isValid } = await verifyAppProxyRequest(request);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { cartId, shopifyDiscountCode, discountPercentage, discountType } = body;

    if (!cartId || !shopifyDiscountCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing cartId or shopifyDiscountCode" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Storefront API client
    const storefront = await getStorefrontApiClient(shop);

    // Set cart metafields via Storefront API (app-owned, namespace: $app)
    const mutation = `
      mutation cartMetafieldsSet($cartId: ID!, $metafields: [CartMetafieldsSetInput!]!) {
        cartMetafieldsSet(cartId: $cartId, metafields: $metafields) {
          cart {
            id
            metafield(namespace: "$app", key: "shopify_discount_code") {
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      cartId,
      metafields: [
        {
          namespace: "$app",
          key: "shopify_discount_code",
          value: shopifyDiscountCode,
          type: "single_line_text_field"
        },
        {
          namespace: "$app",
          key: "discount_percentage",
          value: discountPercentage?.toString() || "10.0",
          type: "number_decimal"
        },
        {
          namespace: "$app",
          key: "discount_type",
          value: discountType || "percentage",
          type: "single_line_text_field"
        }
      ]
    };

    const response = await storefront.request(mutation, { variables });

    if (response.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(response.errors)}`);
    }

    if (response.data?.cartMetafieldsSet?.userErrors?.length > 0) {
      throw new Error(response.data.cartMetafieldsSet.userErrors[0].message);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        cartId: response.data?.cartMetafieldsSet?.cart?.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error setting cart metafields:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to set cart metafields",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Also support GET for testing
export const loader = action;
