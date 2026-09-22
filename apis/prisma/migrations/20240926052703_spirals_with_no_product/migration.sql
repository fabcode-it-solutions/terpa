-- DropForeignKey
ALTER TABLE "machine_spirals" DROP CONSTRAINT "machine_spirals_productId_fkey";

-- AlterTable
ALTER TABLE "machine_spirals" ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "machine_spirals" ADD CONSTRAINT "machine_spirals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
