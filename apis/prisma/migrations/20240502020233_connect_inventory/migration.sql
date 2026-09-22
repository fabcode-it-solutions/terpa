/*
  Warnings:

  - Added the required column `priceCents` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "priceCents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "productPriceCents" INTEGER;
