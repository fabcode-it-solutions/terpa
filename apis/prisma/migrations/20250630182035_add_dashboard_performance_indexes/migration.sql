-- CreateIndex
CREATE INDEX "machines_teamId_deletedAt_activeUntilDate_idx" ON "machines"("teamId", "deletedAt", "activeUntilDate");

-- CreateIndex
CREATE INDEX "machines_teamId_deletedAt_isEnabled_idx" ON "machines"("teamId", "deletedAt", "isEnabled");

-- CreateIndex
CREATE INDEX "machines_activeUntilDate_teamId_idx" ON "machines"("activeUntilDate", "teamId");

-- CreateIndex
CREATE INDEX "products_teamId_deletedAt_idx" ON "products"("teamId", "deletedAt");

-- CreateIndex
CREATE INDEX "sales_machineId_createdAt_paymentMethod_idx" ON "sales"("machineId", "createdAt", "paymentMethod");

-- CreateIndex
CREATE INDEX "sales_createdAt_machineId_idx" ON "sales"("createdAt", "machineId");

-- CreateIndex
CREATE INDEX "sales_paymentMethod_createdAt_idx" ON "sales"("paymentMethod", "createdAt");
