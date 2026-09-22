/*
  Warnings:

  - You are about to drop the column `reconciliationValue` on the `machine_reconciliations` table. All the data in the column will be lost.
  - Added the required column `reconciliationValueCents` to the `machine_reconciliations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "machine_reconciliations" DROP COLUMN "reconciliationValue",
ADD COLUMN     "reconciliationValueCents" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "machine_reconciliations_machineId_createdAt_idx" ON "machine_reconciliations"("machineId", "createdAt");
