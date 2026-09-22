-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_teamId_idx" ON "invoices"("teamId");

-- CreateIndex
CREATE INDEX "invoices_status_teamId_idx" ON "invoices"("status", "teamId");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");
