/*
  Warnings:

  - Added the required column `subtotalCents` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vatAmountCents` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalCents` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vatAmountCents` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- Add columns with defaults first
ALTER TABLE "invoices" 
ADD COLUMN "subtotalCents" INTEGER DEFAULT 0,
ADD COLUMN "vatAmountCents" INTEGER DEFAULT 0,
ADD COLUMN "vatRatePercent" DOUBLE PRECISION DEFAULT 16.0;

ALTER TABLE "invoice_items"
ADD COLUMN "subtotalCents" INTEGER DEFAULT 0,
ADD COLUMN "vatAmountCents" INTEGER DEFAULT 0;

-- Update existing data - treating current prices as pre-VAT amounts
UPDATE "invoices"
SET "subtotalCents" = "totalPriceCents",
    "vatAmountCents" = ROUND("totalPriceCents" * 0.16),
    "totalPriceCents" = "totalPriceCents" + ROUND("totalPriceCents" * 0.16);

UPDATE "invoice_items"
SET "subtotalCents" = "priceCents",
    "vatAmountCents" = ROUND("priceCents" * 0.16),
    "priceCents" = "priceCents" + ROUND("priceCents" * 0.16);

-- Add NOT NULL constraints
ALTER TABLE "invoices"
ALTER COLUMN "subtotalCents" SET NOT NULL,
ALTER COLUMN "vatAmountCents" SET NOT NULL,
ALTER COLUMN "vatRatePercent" SET NOT NULL;

ALTER TABLE "invoice_items"
ALTER COLUMN "subtotalCents" SET NOT NULL,
ALTER COLUMN "vatAmountCents" SET NOT NULL;
