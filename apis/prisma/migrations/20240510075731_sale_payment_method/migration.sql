-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "paymentMethod" "PaymentMethod";
