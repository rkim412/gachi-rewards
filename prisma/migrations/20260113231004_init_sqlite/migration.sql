-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "StorefrontUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "storefrontUserId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReferralDiscountCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referralCode" TEXT NOT NULL,
    "discountCode" TEXT NOT NULL,
    "shopifyDiscountId" TEXT,
    "siteId" TEXT NOT NULL,
    "referrerStorefrontUserId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralDiscountCode_referrerStorefrontUserId_fkey" FOREIGN KEY ("referrerStorefrontUserId") REFERENCES "StorefrontUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralSafeLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "oneTimeCode" TEXT NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "discountCode" TEXT,
    "shopifyDiscountId" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "usedByOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "ReferralSafeLink_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralDiscountCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralJoin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referralCodeId" INTEGER NOT NULL,
    "referrerStorefrontUserId" INTEGER,
    "refereeStorefrontUserId" TEXT,
    "refereeEmail" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "discountCode" TEXT,
    "discountAmount" REAL,
    "orderTotal" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    CONSTRAINT "ReferralJoin_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralDiscountCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralJoin_referrerStorefrontUserId_fkey" FOREIGN KEY ("referrerStorefrontUserId") REFERENCES "StorefrontUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "giveReward" TEXT,
    "getReward" TEXT,
    "type" TEXT DEFAULT 'percentage',
    "amount" REAL DEFAULT 10.0,
    "minimumSpend" REAL,
    "maxReferrals" INTEGER,
    "safeLinkExpiryHours" INTEGER NOT NULL DEFAULT 168,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WebhookQueue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topic" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "StorefrontUser_email_siteId_idx" ON "StorefrontUser"("email", "siteId");

-- CreateIndex
CREATE INDEX "StorefrontUser_siteId_idx" ON "StorefrontUser"("siteId");

-- CreateIndex
CREATE INDEX "StorefrontUser_storefrontUserId_idx" ON "StorefrontUser"("storefrontUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontUser_storefrontUserId_siteId_key" ON "StorefrontUser"("storefrontUserId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralDiscountCode_referrerStorefrontUserId_key" ON "ReferralDiscountCode"("referrerStorefrontUserId");

-- CreateIndex
CREATE INDEX "ReferralDiscountCode_discountCode_idx" ON "ReferralDiscountCode"("discountCode");

-- CreateIndex
CREATE INDEX "ReferralDiscountCode_siteId_referrerStorefrontUserId_idx" ON "ReferralDiscountCode"("siteId", "referrerStorefrontUserId");

-- CreateIndex
CREATE INDEX "ReferralDiscountCode_siteId_idx" ON "ReferralDiscountCode"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralDiscountCode_referralCode_siteId_key" ON "ReferralDiscountCode"("referralCode", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralSafeLink_oneTimeCode_key" ON "ReferralSafeLink"("oneTimeCode");

-- CreateIndex
CREATE INDEX "ReferralSafeLink_oneTimeCode_idx" ON "ReferralSafeLink"("oneTimeCode");

-- CreateIndex
CREATE INDEX "ReferralSafeLink_used_idx" ON "ReferralSafeLink"("used");

-- CreateIndex
CREATE INDEX "ReferralSafeLink_expiresAt_idx" ON "ReferralSafeLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ReferralSafeLink_used_expiresAt_idx" ON "ReferralSafeLink"("used", "expiresAt");

-- CreateIndex
CREATE INDEX "ReferralSafeLink_referralCodeId_idx" ON "ReferralSafeLink"("referralCodeId");

-- CreateIndex
CREATE INDEX "ReferralSafeLink_discountCode_idx" ON "ReferralSafeLink"("discountCode");

-- CreateIndex
CREATE INDEX "ReferralJoin_orderId_idx" ON "ReferralJoin"("orderId");

-- CreateIndex
CREATE INDEX "ReferralJoin_siteId_referralCodeId_idx" ON "ReferralJoin"("siteId", "referralCodeId");

-- CreateIndex
CREATE INDEX "ReferralJoin_status_idx" ON "ReferralJoin"("status");

-- CreateIndex
CREATE INDEX "ReferralJoin_refereeEmail_siteId_idx" ON "ReferralJoin"("refereeEmail", "siteId");

-- CreateIndex
CREATE INDEX "ReferralJoin_siteId_createdAt_idx" ON "ReferralJoin"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralJoin_referralCodeId_createdAt_idx" ON "ReferralJoin"("referralCodeId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralJoin_referrerStorefrontUserId_idx" ON "ReferralJoin"("referrerStorefrontUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralJoin_orderId_key" ON "ReferralJoin"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralConfig_siteId_key" ON "ReferralConfig"("siteId");

-- CreateIndex
CREATE INDEX "WebhookQueue_status_createdAt_idx" ON "WebhookQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookQueue_shop_topic_idx" ON "WebhookQueue"("shop", "topic");

-- CreateIndex
CREATE INDEX "WebhookQueue_status_idx" ON "WebhookQueue"("status");
