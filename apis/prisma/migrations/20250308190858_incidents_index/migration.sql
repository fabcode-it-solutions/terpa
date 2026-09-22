-- CreateIndex
CREATE INDEX "incidents_machineId_createdAt_idx" ON "incidents"("machineId", "createdAt");

-- CreateIndex
CREATE INDEX "incidents_resolvedAt_idx" ON "incidents"("resolvedAt");
