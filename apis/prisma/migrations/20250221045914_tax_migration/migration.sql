-- AlterTable
ALTER TABLE "invoice_items" ALTER COLUMN "subtotalCents" DROP DEFAULT,
ALTER COLUMN "vatAmountCents" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "subtotalCents" DROP DEFAULT,
ALTER COLUMN "vatAmountCents" DROP DEFAULT;
