/*
  Warnings:

  - You are about to drop the `ReferralSafeLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `safeLinkExpiryHours` on the `ReferralConfig` table. All the data in the column will be lost.
  - You are about to drop the column `discountCode` on the `ReferralDiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `referralCode` on the `ReferralDiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `referrerStorefrontUserId` on the `ReferralDiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `ReferralDiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `refereeStorefrontUserId` on the `ReferralJoin` table. All the data in the column will be lost.
  - You are about to drop the column `referrerStorefrontUserId` on the `ReferralJoin` table. All the data in the column will be lost.
  - You are about to drop the column `storefrontUserId` on the `StorefrontUser` table. All the data in the column will be lost.
  - You are about to drop the column `shop` on the `WebhookQueue` table. All the data in the column will be lost.
  - Added the required column `oneTimeCode` to the `ReferralDiscountCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referralCodeId` to the `ReferralDiscountCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerId` to the `ReferralJoin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopifyCustomerId` to the `StorefrontUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `WebhookQueue` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ReferralSafeLink_discountCode_idx";

-- DropIndex
DROP INDEX "ReferralSafeLink_referralCodeId_idx";

-- DropIndex
DROP INDEX "ReferralSafeLink_used_expiresAt_idx";

-- DropIndex
DROP INDEX "ReferralSafeLink_expiresAt_idx";

-- DropIndex
DROP INDEX "ReferralSafeLink_used_idx";

-- DropIndex
DROP INDEX "ReferralSafeLink_oneTimeCode_idx";

-- DropIndex
DROP INDEX "ReferralSafeLink_oneTimeCode_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ReferralSafeLink";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralCode_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "StorefrontUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReferralConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "giveReward" TEXT,
    "getReward" TEXT,
    "type" TEXT DEFAULT 'percentage',
    "amount" REAL DEFAULT 10.0,
    "minimumSpend" REAL,
    "maxReferrals" INTEGER,
    "discountCodeExpiryHours" INTEGER NOT NULL DEFAULT 168,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ReferralConfig" ("amount", "createdAt", "enabled", "getReward", "giveReward", "id", "maxReferrals", "minimumSpend", "siteId", "type", "updatedAt") SELECT "amount", "createdAt", "enabled", "getReward", "giveReward", "id", "maxReferrals", "minimumSpend", "siteId", "type", "updatedAt" FROM "ReferralConfig";
DROP TABLE "ReferralConfig";
ALTER TABLE "new_ReferralConfig" RENAME TO "ReferralConfig";
CREATE UNIQUE INDEX "ReferralConfig_siteId_key" ON "ReferralConfig"("siteId");
CREATE TABLE "new_ReferralDiscountCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "oneTimeCode" TEXT NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "code" TEXT,
    "shopifyDiscountId" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "usedByOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "ReferralDiscountCode_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReferralDiscountCode" ("createdAt", "id", "shopifyDiscountId") SELECT "createdAt", "id", "shopifyDiscountId" FROM "ReferralDiscountCode";
DROP TABLE "ReferralDiscountCode";
ALTER TABLE "new_ReferralDiscountCode" RENAME TO "ReferralDiscountCode";
CREATE UNIQUE INDEX "ReferralDiscountCode_oneTimeCode_key" ON "ReferralDiscountCode"("oneTimeCode");
CREATE INDEX "ReferralDiscountCode_oneTimeCode_idx" ON "ReferralDiscountCode"("oneTimeCode");
CREATE INDEX "ReferralDiscountCode_used_idx" ON "ReferralDiscountCode"("used");
CREATE INDEX "ReferralDiscountCode_expiresAt_idx" ON "ReferralDiscountCode"("expiresAt");
CREATE INDEX "ReferralDiscountCode_used_expiresAt_idx" ON "ReferralDiscountCode"("used", "expiresAt");
CREATE INDEX "ReferralDiscountCode_referralCodeId_idx" ON "ReferralDiscountCode"("referralCodeId");
CREATE INDEX "ReferralDiscountCode_code_idx" ON "ReferralDiscountCode"("code");
CREATE TABLE "new_ReferralJoin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referralCodeId" INTEGER NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "refereeShopifyCustomerId" TEXT,
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
    CONSTRAINT "ReferralJoin_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralJoin_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "StorefrontUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReferralJoin" ("createdAt", "discountAmount", "discountCode", "id", "orderId", "orderNumber", "orderTotal", "refereeEmail", "referralCodeId", "siteId", "status", "verifiedAt") SELECT "createdAt", "discountAmount", "discountCode", "id", "orderId", "orderNumber", "orderTotal", "refereeEmail", "referralCodeId", "siteId", "status", "verifiedAt" FROM "ReferralJoin";
DROP TABLE "ReferralJoin";
ALTER TABLE "new_ReferralJoin" RENAME TO "ReferralJoin";
CREATE INDEX "ReferralJoin_orderId_idx" ON "ReferralJoin"("orderId");
CREATE INDEX "ReferralJoin_siteId_referralCodeId_idx" ON "ReferralJoin"("siteId", "referralCodeId");
CREATE INDEX "ReferralJoin_status_idx" ON "ReferralJoin"("status");
CREATE INDEX "ReferralJoin_refereeEmail_siteId_idx" ON "ReferralJoin"("refereeEmail", "siteId");
CREATE INDEX "ReferralJoin_siteId_createdAt_idx" ON "ReferralJoin"("siteId", "createdAt");
CREATE INDEX "ReferralJoin_referralCodeId_createdAt_idx" ON "ReferralJoin"("referralCodeId", "createdAt");
CREATE INDEX "ReferralJoin_referrerId_idx" ON "ReferralJoin"("referrerId");
CREATE UNIQUE INDEX "ReferralJoin_orderId_key" ON "ReferralJoin"("orderId");
CREATE TABLE "new_StorefrontUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "shopifyCustomerId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StorefrontUser" ("createdAt", "email", "id", "siteId") SELECT "createdAt", "email", "id", "siteId" FROM "StorefrontUser";
DROP TABLE "StorefrontUser";
ALTER TABLE "new_StorefrontUser" RENAME TO "StorefrontUser";
CREATE INDEX "StorefrontUser_email_siteId_idx" ON "StorefrontUser"("email", "siteId");
CREATE INDEX "StorefrontUser_siteId_idx" ON "StorefrontUser"("siteId");
CREATE INDEX "StorefrontUser_shopifyCustomerId_idx" ON "StorefrontUser"("shopifyCustomerId");
CREATE UNIQUE INDEX "StorefrontUser_shopifyCustomerId_siteId_key" ON "StorefrontUser"("shopifyCustomerId", "siteId");
CREATE TABLE "new_WebhookQueue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topic" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WebhookQueue" ("attempts", "createdAt", "error", "id", "payload", "processedAt", "status", "topic", "updatedAt") SELECT "attempts", "createdAt", "error", "id", "payload", "processedAt", "status", "topic", "updatedAt" FROM "WebhookQueue";
DROP TABLE "WebhookQueue";
ALTER TABLE "new_WebhookQueue" RENAME TO "WebhookQueue";
CREATE INDEX "WebhookQueue_status_createdAt_idx" ON "WebhookQueue"("status", "createdAt");
CREATE INDEX "WebhookQueue_siteId_topic_idx" ON "WebhookQueue"("siteId", "topic");
CREATE INDEX "WebhookQueue_status_idx" ON "WebhookQueue"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_referrerId_key" ON "ReferralCode"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralCode_siteId_referrerId_idx" ON "ReferralCode"("siteId", "referrerId");

-- CreateIndex
CREATE INDEX "ReferralCode_siteId_idx" ON "ReferralCode"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_siteId_key" ON "ReferralCode"("code", "siteId");
