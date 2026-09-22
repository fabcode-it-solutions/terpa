/*
  Warnings:

  - A unique constraint covering the columns `[token,machineId]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "machineMdbProductId" TEXT,
ADD COLUMN     "token" TEXT,
ALTER COLUMN "machineProductId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sales_token_machineId_key" ON "sales"("token", "machineId");
