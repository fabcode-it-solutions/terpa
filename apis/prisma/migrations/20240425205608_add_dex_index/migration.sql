-- DropIndex
DROP INDEX "dex_reports_machineId_idx";

-- CreateIndex
CREATE INDEX "dex_reports_machineId_createdAt_idx" ON "dex_reports"("machineId", "createdAt");
