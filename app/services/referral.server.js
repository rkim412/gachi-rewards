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
 * @returns {Promise<ReferralDiscountCode>} - The referral code record
 */
export async function findOrCreateReferralCode({
  shop,
  storefrontUserId,
  email,
}) {
  const siteId = shop;

  // Check if user already has a referral code
  let user = await prisma.storefrontUser.findUnique({
    where: {
      storefrontUserId_siteId: {
        storefrontUserId,
        siteId,
      },
    },
    include: {
      referralDiscountCode: true,
    },
  });

  if (user?.referralDiscountCode) {
    return user.referralDiscountCode;
  }

  // Create new user if doesn't exist
  if (!user) {
    user = await prisma.storefrontUser.create({
      data: {
        email,
        storefrontUserId,
        siteId,
      },
    });
  }

  // Generate unique referral code
  let referralCode;
  let attempts = 0;
  do {
    referralCode = generateReferralCode();
    const exists = await prisma.referralDiscountCode.findUnique({
      where: {
        referralCode_siteId: {
          referralCode,
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

  // Create referral discount code record (discount will be created separately)
  const discountCodeRecord = await prisma.referralDiscountCode.create({
    data: {
      referralCode,
      discountCode: "", // Will be updated after Shopify creates discount
      siteId,
      referrerStorefrontUserId: user.id,
    },
  });

  return discountCodeRecord;
}

/**
 * Create a safe one-time link
 * @param {Object} params - Parameters
 * @param {string} params.referralCode - The referral code
 * @param {string} params.shop - Shop domain
 * @returns {Promise<Object>} - Safe link record with discount code
 */
export async function createSafeLink({ referralCode, shop }) {
  const siteId = shop;

  // Find the referral code
  const referralCodeRecord = await prisma.referralDiscountCode.findUnique({
    where: {
      referralCode_siteId: {
        referralCode,
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

  const expiryHours = config?.safeLinkExpiryHours || 168; // 7 days default
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  // Generate unique one-time code
  let oneTimeCode;
  let attempts = 0;
  do {
    oneTimeCode = generateReferralCode() + "-" + Date.now().toString(36).toUpperCase();
    const exists = await prisma.referralSafeLink.findUnique({
      where: { oneTimeCode },
    });
    if (!exists) break;
    attempts++;
    if (attempts > 10) {
      throw new Error("Failed to generate unique safe link");
    }
  } while (true);

  const safeLink = await prisma.referralSafeLink.create({
    data: {
      oneTimeCode,
      referralCodeId: referralCodeRecord.id,
      expiresAt,
    },
  });

  return {
    ...safeLink,
    discountCode: referralCodeRecord.discountCode,
  };
}

/**
 * Find referral code by safe link
 * @param {string} oneTimeCode - The one-time code
 * @returns {Promise<ReferralDiscountCode|null>} - The referral code or null
 */
export async function findReferralBySafeLink(oneTimeCode) {
  const safeLink = await prisma.referralSafeLink.findUnique({
    where: { oneTimeCode },
    include: {
      referralCode: true,
    },
  });

  if (!safeLink) {
    return null;
  }

  // Check if expired
  if (safeLink.expiresAt && new Date() > safeLink.expiresAt) {
    return null;
  }

  // Check if already used
  if (safeLink.used) {
    return null;
  }

  return safeLink.referralCode;
}

/**
 * Mark safe link as used
 * @param {string} oneTimeCode - The one-time code
 * @param {string} orderId - Shopify order ID
 * @returns {Promise<ReferralSafeLink>} - Updated safe link
 */
export async function markSafeLinkUsed(oneTimeCode, orderId) {
  return await prisma.referralSafeLink.update({
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
 * @param {string} params.referralCode - Referral code used
 * @param {string} params.orderId - Shopify order ID
 * @param {string} params.orderNumber - Order number
 * @param {string} params.refereeEmail - Referee email
 * @param {string} params.refereeStorefrontUserId - Referee Shopify Customer ID
 * @param {string} params.discountCode - Discount code applied
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
  const referralCodeRecord = await prisma.referralDiscountCode.findUnique({
    where: {
      referralCode_siteId: {
        referralCode,
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
      referrerStorefrontUserId: referrer.id, // Direct referrer link
      refereeStorefrontUserId: refereeStorefrontUserId,
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
        safeLinkExpiryHours: 168,
      },
    });
  }

  return config;
}

