-- CreateTable
CREATE TABLE "StorefrontUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "storefrontUserId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorefrontUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralDiscountCode" (
    "id" SERIAL NOT NULL,
    "referralCode" TEXT NOT NULL,
    "discountCode" TEXT NOT NULL,
    "shopifyDiscountId" TEXT,
    "siteId" TEXT NOT NULL,
    "referrerStorefrontUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralDiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralSafeLink" (
    "id" SERIAL NOT NULL,
    "oneTimeCode" TEXT NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedByOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ReferralSafeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralJoin" (
    "id" SERIAL NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "referrerStorefrontUserId" INTEGER,
    "refereeStorefrontUserId" TEXT,
    "refereeEmail" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "discountCode" TEXT,
    "discountAmount" DOUBLE PRECISION,
    "orderTotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralJoin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralConfig" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "giveReward" TEXT,
    "getReward" TEXT,
    "type" TEXT DEFAULT 'percentage',
    "amount" DOUBLE PRECISION DEFAULT 10.0,
    "minimumSpend" DOUBLE PRECISION,
    "maxReferrals" INTEGER,
    "safeLinkExpiryHours" INTEGER NOT NULL DEFAULT 168,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralConfig_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "ReferralDiscountCode" ADD CONSTRAINT "ReferralDiscountCode_referrerStorefrontUserId_fkey" FOREIGN KEY ("referrerStorefrontUserId") REFERENCES "StorefrontUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralSafeLink" ADD CONSTRAINT "ReferralSafeLink_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralDiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralJoin" ADD CONSTRAINT "ReferralJoin_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralDiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralJoin" ADD CONSTRAINT "ReferralJoin_referrerStorefrontUserId_fkey" FOREIGN KEY ("referrerStorefrontUserId") REFERENCES "StorefrontUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
