-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('PRODUCT', 'SERVICE', 'PHONE_RECHARGE');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "teacelApiResponse" TEXT,
ADD COLUMN     "teacelServiceId" TEXT,
ADD COLUMN     "teacelTransactionId" TEXT,
ADD COLUMN     "type" "SaleType" NOT NULL DEFAULT 'PRODUCT';
