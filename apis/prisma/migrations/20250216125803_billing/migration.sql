/*
  Warnings:

  - The values [PENDING,PAID] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvoicePaymentMethod" AS ENUM ('MANUAL', 'MERCADOPAGO');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('PAYMENT_PENDING', 'PAYMENT_VERIFICATION_PENDING', 'PAYMENT_VERIFICATION_REJECTED', 'PAYMENT_SUCCESS', 'CANCELLED');
ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'PAYMENT_PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "approvedAt" TIMESTAMPTZ,
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "cancelledByUserId" TEXT,
ADD COLUMN     "paymentMethod" "InvoicePaymentMethod",
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMPTZ,
ADD COLUMN     "rejectedByUserId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PAYMENT_PENDING';

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
