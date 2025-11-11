import { authenticate } from "../shopify.server.js";

/**
 * Create a discount code in Shopify
 * @param {Object} params - Parameters
 * @param {Request} params.request - The request object (for authentication)
 * @param {string} params.code - Discount code (e.g., "GACHI-ALICE123")
 * @param {number} params.percentageValue - Discount percentage (e.g., 10 for 10%)
 * @param {number} params.usageLimit - Maximum number of uses (default: 1)
 * @param {Object} params.minimumRequirement - Minimum requirement for discount
 * @returns {Promise<{id: string, code: string}>} - Created discount info
 */
export async function createShopifyDiscount({
  request,
  code,
  percentageValue,
  usageLimit = 1,
  minimumRequirement = null,
}) {
  const { admin } = await authenticate.admin(request);

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                nodes {
                  code
                }
              }
              usageLimit
              appliesOncePerCustomer
            }
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
    basicCodeDiscount: {
      code,
      basicCodeDiscount: {
        minimumRequirement: minimumRequirement || {
          subtotal: {
            greaterThanOrEqualToSubtotal: "0",
          },
        },
        customerGets: {
          value: {
            percentage: percentageValue / 100, // Convert to decimal
          },
          items: {
            all: true,
          },
        },
        startsAt: new Date().toISOString(),
        usageLimit,
        appliesOncePerCustomer: true,
      },
    },
  };

  const response = await admin.graphql(mutation, { variables });
  const responseJson = await response.json();

  if (responseJson.errors) {
    throw new Error(
      `GraphQL Error: ${JSON.stringify(responseJson.errors)}`
    );
  }

  const userErrors = responseJson.data?.discountCodeBasicCreate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    throw new Error(
      `Discount creation errors: ${JSON.stringify(userErrors)}`
    );
  }

  const discountNode = responseJson.data?.discountCodeBasicCreate?.codeDiscountNode;
  if (!discountNode) {
    throw new Error("Failed to create discount code");
  }

  return {
    id: discountNode.id,
    code: discountNode.codeDiscount?.codes?.nodes?.[0]?.code || code,
  };
}

/**
 * Get discount code details
 * @param {Object} params - Parameters
 * @param {Request} params.request - The request object (for authentication)
 * @param {string} params.discountId - Shopify discount ID (GID)
 * @returns {Promise<Object>} - Discount details
 */
export async function getShopifyDiscount({ request, discountId }) {
  const { admin } = await authenticate.admin(request);

  const query = `
    query getDiscount($id: ID!) {
      codeDiscountNode(id: $id) {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) {
              nodes {
                code
              }
            }
            usageLimit
            usageCount
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query, {
    variables: { id: discountId },
  });
  const responseJson = await response.json();

  return responseJson.data?.codeDiscountNode;
}

