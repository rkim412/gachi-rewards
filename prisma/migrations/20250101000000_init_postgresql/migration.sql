-- CreateTable (with IF NOT EXISTS to handle partial migrations)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN,
    "emailVerified" BOOLEAN,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StorefrontUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "storefrontUserId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorefrontUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReferralDiscountCode" (
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
CREATE TABLE IF NOT EXISTS "ReferralSafeLink" (
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
CREATE TABLE IF NOT EXISTS "ReferralJoin" (
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
CREATE TABLE IF NOT EXISTS "ReferralConfig" (
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

-- CreateIndex (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "StorefrontUser_storefrontUserId_siteId_idx" ON "StorefrontUser"("storefrontUserId", "siteId");
CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontUser_storefrontUserId_siteId_key" ON "StorefrontUser"("storefrontUserId", "siteId");
CREATE INDEX IF NOT EXISTS "StorefrontUser_email_siteId_idx" ON "StorefrontUser"("email", "siteId");
CREATE INDEX IF NOT EXISTS "StorefrontUser_siteId_idx" ON "StorefrontUser"("siteId");
CREATE INDEX IF NOT EXISTS "StorefrontUser_storefrontUserId_idx" ON "StorefrontUser"("storefrontUserId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralDiscountCode_referralCode_siteId_key" ON "ReferralDiscountCode"("referralCode", "siteId");
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralDiscountCode_referrerStorefrontUserId_key" ON "ReferralDiscountCode"("referrerStorefrontUserId");
CREATE INDEX IF NOT EXISTS "ReferralDiscountCode_discountCode_idx" ON "ReferralDiscountCode"("discountCode");
CREATE INDEX IF NOT EXISTS "ReferralDiscountCode_siteId_referrerStorefrontUserId_idx" ON "ReferralDiscountCode"("siteId", "referrerStorefrontUserId");
CREATE INDEX IF NOT EXISTS "ReferralDiscountCode_siteId_idx" ON "ReferralDiscountCode"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralSafeLink_oneTimeCode_key" ON "ReferralSafeLink"("oneTimeCode");
CREATE INDEX IF NOT EXISTS "ReferralSafeLink_oneTimeCode_idx" ON "ReferralSafeLink"("oneTimeCode");
CREATE INDEX IF NOT EXISTS "ReferralSafeLink_used_idx" ON "ReferralSafeLink"("used");
CREATE INDEX IF NOT EXISTS "ReferralSafeLink_expiresAt_idx" ON "ReferralSafeLink"("expiresAt");
CREATE INDEX IF NOT EXISTS "ReferralSafeLink_used_expiresAt_idx" ON "ReferralSafeLink"("used", "expiresAt");
CREATE INDEX IF NOT EXISTS "ReferralSafeLink_referralCodeId_idx" ON "ReferralSafeLink"("referralCodeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralJoin_orderId_key" ON "ReferralJoin"("orderId");
CREATE INDEX IF NOT EXISTS "ReferralJoin_orderId_idx" ON "ReferralJoin"("orderId");
CREATE INDEX IF NOT EXISTS "ReferralJoin_siteId_referralCodeId_idx" ON "ReferralJoin"("siteId", "referralCodeId");
CREATE INDEX IF NOT EXISTS "ReferralJoin_status_idx" ON "ReferralJoin"("status");
CREATE INDEX IF NOT EXISTS "ReferralJoin_refereeEmail_siteId_idx" ON "ReferralJoin"("refereeEmail", "siteId");
CREATE INDEX IF NOT EXISTS "ReferralJoin_siteId_createdAt_idx" ON "ReferralJoin"("siteId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReferralJoin_referralCodeId_createdAt_idx" ON "ReferralJoin"("referralCodeId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReferralJoin_referrerStorefrontUserId_idx" ON "ReferralJoin"("referrerStorefrontUserId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralConfig_siteId_key" ON "ReferralConfig"("siteId");

-- AddForeignKey (with IF NOT EXISTS check - PostgreSQL doesn't support IF NOT EXISTS for constraints, so we'll use DO blocks)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReferralDiscountCode_referrerStorefrontUserId_fkey'
    ) THEN
        ALTER TABLE "ReferralDiscountCode" ADD CONSTRAINT "ReferralDiscountCode_referrerStorefrontUserId_fkey" 
        FOREIGN KEY ("referrerStorefrontUserId") REFERENCES "StorefrontUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReferralSafeLink_referralCodeId_fkey'
    ) THEN
        ALTER TABLE "ReferralSafeLink" ADD CONSTRAINT "ReferralSafeLink_referralCodeId_fkey" 
        FOREIGN KEY ("referralCodeId") REFERENCES "ReferralDiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReferralJoin_referralCodeId_fkey'
    ) THEN
        ALTER TABLE "ReferralJoin" ADD CONSTRAINT "ReferralJoin_referralCodeId_fkey" 
        FOREIGN KEY ("referralCodeId") REFERENCES "ReferralDiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ReferralJoin_referrerStorefrontUserId_fkey'
    ) THEN
        ALTER TABLE "ReferralJoin" ADD CONSTRAINT "ReferralJoin_referrerStorefrontUserId_fkey" 
        FOREIGN KEY ("referrerStorefrontUserId") REFERENCES "StorefrontUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
