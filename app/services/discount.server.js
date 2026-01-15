import { authenticate } from "../shopify.server.js";

// Cache for the discount function ID (per shop)
const functionIdCache = new Map();

/**
 * Get the Discount Function ID for the referral-discount-function
 * @param {AdminApiContext} admin - Admin GraphQL client
 * @returns {Promise<string|null>} - Function GID or null if not found
 */
export async function getDiscountFunctionId(admin) {
  const query = `
    query getDiscountFunctions {
      shopifyFunctions(first: 50) {
        nodes {
          id
          title
          apiType
          app {
            title
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const responseJson = await response.json();

    const functions = responseJson.data?.shopifyFunctions?.nodes || [];
    
    // Find our referral discount function
    // Look for function with apiType containing "discount" and from our app
    const discountFunction = functions.find(fn => 
      fn.apiType?.toLowerCase().includes('discount') &&
      (fn.title?.toLowerCase().includes('referral') || 
       fn.app?.title?.toLowerCase().includes('gachi'))
    );

    if (discountFunction) {
      console.log(`[DISCOUNT] Found discount function: ${discountFunction.id} (${discountFunction.title})`);
      return discountFunction.id;
    }

    console.warn('[DISCOUNT] No discount function found. Available functions:', 
      functions.map(f => ({ id: f.id, title: f.title, apiType: f.apiType }))
    );
    return null;
  } catch (error) {
    console.error('[DISCOUNT] Error fetching discount function:', error);
    return null;
  }
}

/**
 * Create an App discount code in Shopify (backed by our Discount Function)
 * This creates a REAL Shopify discount that triggers our Function
 * @param {Object} params - Parameters
 * @param {AdminApiContext} params.admin - Admin GraphQL client
 * @param {string} params.code - Discount code (e.g., "GACHI-ALICE123-XYZ")
 * @param {string} params.title - Discount title for admin display
 * @param {Date} [params.endsAt] - When the discount expires
 * @param {number} [params.usageLimit] - Maximum number of uses (default: 1)
 * @param {Object} [params.metafields] - Metafields to attach to the discount
 * @returns {Promise<{id: string, code: string}|null>} - Created discount info or null if function not found
 */
export async function createAppDiscount({
  admin,
  code,
  title,
  endsAt = null,
  usageLimit = 1,
  metafields = null,
}) {
  // Get the function ID (with caching)
  let functionId = functionIdCache.get('default');
  if (!functionId) {
    functionId = await getDiscountFunctionId(admin);
    if (functionId) {
      functionIdCache.set('default', functionId);
    }
  }

  if (!functionId) {
    console.warn('[DISCOUNT] Cannot create app discount - no function found');
    return null;
  }

  const mutation = `
    mutation discountCodeAppCreate($codeAppDiscount: DiscountCodeAppInput!) {
      discountCodeAppCreate(codeAppDiscount: $codeAppDiscount) {
        codeAppDiscount {
          discountId
          codes(first: 1) {
            nodes {
              code
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
    codeAppDiscount: {
      code,
      functionId,
      title: title || `Referral Discount: ${code}`,
      startsAt: new Date().toISOString(),
      endsAt: endsAt ? endsAt.toISOString() : null,
      usageLimit,
      appliesOncePerCustomer: true,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: true,
        shippingDiscounts: true,
      },
    },
  };

  // Add metafields if provided
  if (metafields && Array.isArray(metafields) && metafields.length > 0) {
    variables.codeAppDiscount.metafields = metafields;
  }

  try {
    const response = await admin.graphql(mutation, { variables });
    const responseJson = await response.json();

    if (responseJson.errors) {
      console.error('[DISCOUNT] GraphQL errors:', responseJson.errors);
      throw new Error(`GraphQL Error: ${JSON.stringify(responseJson.errors)}`);
    }

    const userErrors = responseJson.data?.discountCodeAppCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.error('[DISCOUNT] User errors:', userErrors);
      throw new Error(`Discount creation errors: ${JSON.stringify(userErrors)}`);
    }

    const discount = responseJson.data?.discountCodeAppCreate?.codeAppDiscount;
    if (!discount) {
      throw new Error('Failed to create app discount code');
    }

    const result = {
      id: discount.discountId,
      code: discount.codes?.nodes?.[0]?.code || code,
    };

    console.log(`[DISCOUNT] Created app discount: ${result.code} (${result.id})`);
    return result;
  } catch (error) {
    console.error('[DISCOUNT] Error creating app discount:', error);
    throw error;
  }
}

/**
 * Delete a discount code in Shopify
 * @param {Object} params - Parameters
 * @param {AdminApiContext} params.admin - Admin GraphQL client
 * @param {string} params.discountId - Shopify discount ID (GID)
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export async function deleteShopifyDiscount({ admin, discountId }) {
  const mutation = `
    mutation discountCodeDelete($id: ID!) {
      discountCodeDelete(id: $id) {
        deletedCodeDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(mutation, {
      variables: { id: discountId },
    });
    const responseJson = await response.json();

    const userErrors = responseJson.data?.discountCodeDelete?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.warn('[DISCOUNT] Delete errors:', userErrors);
      return false;
    }

    return !!responseJson.data?.discountCodeDelete?.deletedCodeDiscountId;
  } catch (error) {
    console.error('[DISCOUNT] Error deleting discount:', error);
    return false;
  }
}

/**
 * Create a discount code in Shopify (LEGACY - basic discount, not backed by function)
 * @deprecated Use createAppDiscount instead for function-backed discounts
 * @param {Object} params - Parameters
 * @param {Request} [params.request] - The request object (for authentication) - required if admin not provided
 * @param {AdminApiContext} [params.admin] - Admin GraphQL client - required if request not provided
 * @param {string} params.code - Discount code (e.g., "GACHI-ALICE123")
 * @param {number} params.percentageValue - Discount percentage (e.g., 10 for 10%)
 * @param {number} params.usageLimit - Maximum number of uses (default: 1)
 * @param {Object} params.minimumRequirement - Minimum requirement for discount
 * @returns {Promise<{id: string, code: string}>} - Created discount info
 */
export async function createShopifyDiscount({
  request,
  admin: providedAdmin,
  code,
  percentageValue,
  usageLimit = 1,
  minimumRequirement = null,
}) {
  // Get admin context from request or use provided admin
  let admin = providedAdmin;
  if (!admin && request) {
    const authResult = await authenticate.admin(request);
    admin = authResult.admin;
  }
  
  if (!admin) {
    throw new Error("Either 'request' or 'admin' must be provided to createShopifyDiscount");
  }

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
 * @param {Request} [params.request] - The request object (for authentication) - required if admin not provided
 * @param {AdminApiContext} [params.admin] - Admin GraphQL client - required if request not provided
 * @param {string} params.discountId - Shopify discount ID (GID)
 * @returns {Promise<Object>} - Discount details
 */
export async function getShopifyDiscount({ request, admin: providedAdmin, discountId }) {
  // Get admin context from request or use provided admin
  let admin = providedAdmin;
  if (!admin && request) {
    const authResult = await authenticate.admin(request);
    admin = authResult.admin;
  }
  
  if (!admin) {
    throw new Error("Either 'request' or 'admin' must be provided to getShopifyDiscount");
  }

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

