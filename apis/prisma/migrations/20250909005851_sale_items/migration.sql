/*
  Warnings:

  - You are about to drop the `SaleItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_saleId_fkey";

-- DropTable
DROP TABLE "SaleItem";

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "machineProductId" TEXT,
    "machineMdbProductId" TEXT,
    "machineMicromarketCode" TEXT,
    "productPriceCents" INTEGER,
    "productSku" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
