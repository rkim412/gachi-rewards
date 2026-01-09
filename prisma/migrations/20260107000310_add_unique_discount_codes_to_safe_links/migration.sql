-- AlterTable
ALTER TABLE "ReferralSafeLink" ADD COLUMN "discountCode" TEXT;
ALTER TABLE "ReferralSafeLink" ADD COLUMN "shopifyDiscountId" TEXT;

-- CreateIndex
CREATE INDEX "ReferralSafeLink_discountCode_idx" ON "ReferralSafeLink"("discountCode");
