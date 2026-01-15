import prisma from "../db.server.js";

/**
 * Generate a unique referral code (6-8 characters, uppercase)
 * Excludes confusing characters (0, O, I, 1, L)
 */
export function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate referral code format
 * @param {string} code - The referral code to validate
 * @returns {boolean} - True if valid format
 */
export function validateReferralCode(code) {
  return /^[A-Z0-9]{6,10}$/.test(code);
}

/**
 * Find or create a referral code for a user
 * @param {Object} params - Parameters
 * @param {string} params.shop - Shop domain
 * @param {string} params.storefrontUserId - Shopify Customer ID (GID)
 * @param {string} params.email - Customer email
 * @returns {Promise<ReferralCode>} - The referral code record
 */
export async function findOrCreateReferralCode({
  shop,
  storefrontUserId,
  email,
}) {
  const siteId = shop;

  // PRIMARY: Check if user already exists by email (more reliable than shopifyCustomerId)
  // Email is more stable - customer IDs can change or vary in format, guest customers may have inconsistent IDs
  let user = null;
  if (email) {
    const usersWithEmail = await prisma.storefrontUser.findMany({
      where: {
        email: email,
        siteId: siteId,
      },
      include: {
        referralCode: true,
      },
    });

    if (usersWithEmail.length > 0) {
      // Found user(s) by email - use the first one that has a referral code, or the first one
      const userWithCode = usersWithEmail.find(u => u.referralCode);
      user = userWithCode || usersWithEmail[0];
      
      console.log(`[REFERRAL] Found user by email (primary lookup):`, {
        shopifyCustomerId: user.shopifyCustomerId,
        email: user.email,
        hasReferralCode: !!user.referralCode,
      });

      // If the shopifyCustomerId differs, update it to match the current request
      // This helps merge entries when customer ID format changes
      if (user.shopifyCustomerId !== storefrontUserId && !storefrontUserId.startsWith('guest-')) {
        console.log(`[REFERRAL] Updating shopifyCustomerId from ${user.shopifyCustomerId} to ${storefrontUserId}`);
        user = await prisma.storefrontUser.update({
          where: { id: user.id },
          data: {
            shopifyCustomerId: storefrontUserId,
          },
          include: {
            referralCode: true,
          },
        });
      }

      // If user has a referral code, return it
      if (user.referralCode) {
        return user.referralCode;
      }
    }
  }

  // FALLBACK: If not found by email, try to find by shopifyCustomerId
  // This handles cases where email might not be available or differs slightly
  if (!user && storefrontUserId) {
    console.log(`[REFERRAL] User not found by email (${email}), trying shopifyCustomerId lookup: ${storefrontUserId}`);
    
    user = await prisma.storefrontUser.findUnique({
      where: {
        shopifyCustomerId_siteId: {
          shopifyCustomerId: storefrontUserId,
          siteId,
        },
      },
      include: {
        referralCode: true,
      },
    });

    if (user) {
      console.log(`[REFERRAL] Found user by shopifyCustomerId:`, {
        shopifyCustomerId: user.shopifyCustomerId,
        email: user.email,
        hasReferralCode: !!user.referralCode,
      });

      // If email differs, log it as additional email (but don't update)
      if (user.email !== email && email) {
        console.log(`[REFERRAL] Additional email detected for shopifyCustomerId ${storefrontUserId}:`, {
          storedEmail: user.email,
          additionalEmail: email,
        });
      }

      // If user has a referral code, return it
      if (user.referralCode) {
        return user.referralCode;
      }
    }
  }

  // If user already has a referral code, return it
  if (user?.referralCode) {
    return user.referralCode;
  }

  // Create new user if doesn't exist
  if (!user) {
    user = await prisma.storefrontUser.create({
      data: {
        email,
        shopifyCustomerId: storefrontUserId,
        siteId,
      },
    });
  }

  // Generate unique referral code
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode();
    const exists = await prisma.referralCode.findUnique({
      where: {
        code_siteId: {
          code,
          siteId,
        },
      },
    });
    if (!exists) break;
    attempts++;
    if (attempts > 10) {
      throw new Error("Failed to generate unique referral code");
    }
  } while (true);

  // Create referral code record
  try {
    console.log(`[REFERRAL] Creating referral code in database:`, {
      code,
      siteId,
      referrerId: user.id,
      userEmail: user.email,
      userId: user.id,
    });
    
    const referralCodeRecord = await prisma.referralCode.create({
      data: {
        code,
        siteId,
        referrerId: user.id,
      },
    });

    console.log(`[REFERRAL] Successfully created referral code in database:`, {
      id: referralCodeRecord.id,
      code: referralCodeRecord.code,
      siteId: referralCodeRecord.siteId,
      referrerId: referralCodeRecord.referrerId,
      createdAt: referralCodeRecord.createdAt,
    });

    // Verify it was actually saved by reading it back
    const verifyRecord = await prisma.referralCode.findUnique({
      where: {
        code_siteId: {
          code,
          siteId,
        },
      },
    });

    if (verifyRecord) {
      console.log(`[REFERRAL] Verified: Referral code exists in database`);
    } else {
      console.error(`[REFERRAL ERROR] Verification failed: Referral code not found after creation!`);
    }

    return referralCodeRecord;
  } catch (error) {
    console.error(`[REFERRAL ERROR] Failed to create referral code in database:`, {
      error: error.message,
      code: error.code,
      meta: error.meta,
      referralCode: code,
      siteId,
      referrerId: user.id,
    });
    throw error; // Re-throw so caller knows it failed
  }
}

/**
 * Create a one-time discount code from a referral code
 * @param {Object} params - Parameters
 * @param {string} params.referralCode - The referral code (e.g., "ALICE123")
 * @param {string} params.shop - Shop domain
 * @returns {Promise<Object>} - Discount code record with unique Shopify discount code
 */
export async function createDiscountCode({ referralCode, shop }) {
  const siteId = shop;

  // Find the referral code
  const referralCodeRecord = await prisma.referralCode.findUnique({
    where: {
      code_siteId: {
        code: referralCode,
        siteId,
      },
    },
  });

  if (!referralCodeRecord) {
    throw new Error("Referral code not found");
  }

  // Get config for expiry
  const config = await prisma.referralConfig.findUnique({
    where: { siteId },
  });

  const expiryHours = config?.discountCodeExpiryHours || 168; // 7 days default
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  // Generate unique one-time code for tracking
  let oneTimeCode;
  let attempts = 0;
  do {
    oneTimeCode = generateReferralCode() + "-" + Date.now().toString(36).toUpperCase();
    const exists = await prisma.referralDiscountCode.findUnique({
      where: { oneTimeCode },
    });
    if (!exists) break;
    attempts++;
    if (attempts > 10) {
      throw new Error("Failed to generate unique discount code");
    }
  } while (true);

  // Generate unique discount code suffix (4-6 characters)
  const discountSuffix = generateReferralCode().substring(0, 6);
  const uniqueDiscountCode = `GACHI-${referralCode}-${discountSuffix}`;

  const discountCodeRecord = await prisma.referralDiscountCode.create({
    data: {
      oneTimeCode,
      referralCodeId: referralCodeRecord.id,
      expiresAt,
      code: uniqueDiscountCode, // Store the unique discount code
    },
  });

  return {
    ...discountCodeRecord,
    discountCode: uniqueDiscountCode, // Return the discount code for use
  };
}

/**
 * Find referral code by discount code's one-time code
 * @param {string} oneTimeCode - The one-time code
 * @returns {Promise<ReferralCode|null>} - The referral code or null
 */
export async function findReferralByDiscountCode(oneTimeCode) {
  const discountCode = await prisma.referralDiscountCode.findUnique({
    where: { oneTimeCode },
    include: {
      referralCode: true,
    },
  });

  if (!discountCode) {
    return null;
  }

  // Check if expired
  if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
    return null;
  }

  // Check if already used
  if (discountCode.used) {
    return null;
  }

  return discountCode.referralCode;
}

/**
 * Mark discount code as used
 * @param {string} oneTimeCode - The one-time code
 * @param {string} orderId - Shopify order ID
 * @returns {Promise<ReferralDiscountCode>} - Updated discount code record
 */
export async function markDiscountCodeUsed(oneTimeCode, orderId) {
  return await prisma.referralDiscountCode.update({
    where: { oneTimeCode },
    data: {
      used: true,
      usedAt: new Date(),
      usedByOrderId: orderId,
    },
  });
}

/**
 * Create referral join record
 * @param {Object} params - Parameters
 * @param {string} params.shop - Shop domain
 * @param {string} params.referralCode - Referral code used (e.g., "ALICE123")
 * @param {string} params.orderId - Shopify order ID
 * @param {string} params.orderNumber - Order number
 * @param {string} params.refereeEmail - Referee email
 * @param {string} params.refereeStorefrontUserId - Referee Shopify Customer ID (GID)
 * @param {string} params.discountCode - Discount code applied (e.g., "GACHI-ALICE123-XK7N")
 * @param {number} params.orderTotal - Order total
 * @param {number} params.discountAmount - Discount amount
 * @returns {Promise<ReferralJoin>} - Created referral join record
 */
export async function createReferralJoin({
  shop,
  referralCode,
  orderId,
  orderNumber,
  refereeEmail,
  refereeStorefrontUserId,
  discountCode,
  orderTotal,
  discountAmount,
}) {
  const siteId = shop;

  // Find referral code record
  const referralCodeRecord = await prisma.referralCode.findUnique({
    where: {
      code_siteId: {
        code: referralCode,
        siteId,
      },
    },
    include: {
      referrer: true,
    },
  });

  if (!referralCodeRecord) {
    throw new Error("Referral code not found");
  }

  // Get referrer info
  const referrer = referralCodeRecord.referrer;

  // Prevent self-referral
  if (referrer?.email === refereeEmail) {
    throw new Error("Cannot refer yourself");
  }

  // Create referral join with direct referrer link
  const referralJoin = await prisma.referralJoin.create({
    data: {
      referralCodeId: referralCodeRecord.id,
      referrerId: referrer.id, // Direct referrer link
      refereeShopifyCustomerId: refereeStorefrontUserId,
      refereeEmail,
      siteId,
      orderId,
      orderNumber,
      discountCode,
      discountAmount,
      orderTotal,
      status: "pending",
    },
  });

  return referralJoin;
}

/**
 * Get or create shop config
 * @param {string} shop - Shop domain
 * @returns {Promise<ReferralConfig>} - Shop configuration
 */
export async function getOrCreateShopConfig(shop) {
  let config = await prisma.referralConfig.findUnique({
    where: { siteId: shop },
  });

  if (!config) {
    config = await prisma.referralConfig.create({
      data: {
        siteId: shop,
        enabled: true,
        type: "percentage",
        amount: 10.0,
        discountCodeExpiryHours: 168,
      },
    });
  }

  return config;
}

// ============================================================================
// LEGACY ALIASES (for backward compatibility during migration)
// These can be removed after all code is updated
// ============================================================================

/**
 * @deprecated Use createDiscountCode instead
 */
export const createSafeLink = createDiscountCode;

/**
 * @deprecated Use findReferralByDiscountCode instead
 */
export const findReferralBySafeLink = findReferralByDiscountCode;

/**
 * @deprecated Use markDiscountCodeUsed instead
 */
export const markSafeLinkUsed = markDiscountCodeUsed;
