-- CreateEnum
CREATE TYPE "SaleVersion" AS ENUM ('V1', 'V2');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "version" "SaleVersion" NOT NULL DEFAULT 'V1';

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "machineProductId" TEXT,
    "machineMdbProductId" TEXT,
    "machineMicromarketCode" TEXT,
    "productPriceCents" INTEGER,
    "productSku" TEXT,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
