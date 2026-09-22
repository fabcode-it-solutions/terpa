-- CreateEnum
CREATE TYPE "ManualPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "manualPaymentMethod" "ManualPaymentMethod";
