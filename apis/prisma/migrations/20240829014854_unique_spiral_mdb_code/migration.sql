/*
  Warnings:

  - A unique constraint covering the columns `[machineId,machineMdbCode]` on the table `machine_spirals` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "machine_spirals_machineId_machineMdbCode_key" ON "machine_spirals"("machineId", "machineMdbCode");
