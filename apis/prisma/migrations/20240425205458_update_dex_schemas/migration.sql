/*
  Warnings:

  - You are about to drop the `audits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audits" DROP CONSTRAINT "audits_machineId_fkey";

-- DropTable
DROP TABLE "audits";

-- CreateTable
CREATE TABLE "dex_reports" (
    "reportId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dex_reports_pkey" PRIMARY KEY ("reportId")
);

-- CreateIndex
CREATE INDEX "dex_reports_machineId_idx" ON "dex_reports"("machineId");

-- AddForeignKey
ALTER TABLE "dex_reports" ADD CONSTRAINT "dex_reports_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
