-- CreateIndex
CREATE INDEX "dex_reports_createdAt_machineId_idx" ON "dex_reports"("createdAt", "machineId");

-- CreateIndex
CREATE INDEX "machine_spirals_machineId_deletedAt_idx" ON "machine_spirals"("machineId", "deletedAt");

-- CreateIndex
CREATE INDEX "machine_spirals_productId_deletedAt_idx" ON "machine_spirals"("productId", "deletedAt");

-- CreateIndex
CREATE INDEX "machine_spirals_machineId_deletedAt_productId_idx" ON "machine_spirals"("machineId", "deletedAt", "productId");

-- CreateIndex
CREATE INDEX "products_teamId_deletedAt_createdAt_idx" ON "products"("teamId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "products_createdAt_teamId_idx" ON "products"("createdAt", "teamId");

-- CreateIndex
CREATE INDEX "sales_machineId_productId_createdAt_idx" ON "sales"("machineId", "productId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_productId_createdAt_idx" ON "sales"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_createdAt_paymentMethod_machineId_idx" ON "sales"("createdAt", "paymentMethod", "machineId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_role_teamId_idx" ON "team_members"("role", "teamId");

-- CreateIndex
CREATE INDEX "user_machines_userId_idx" ON "user_machines"("userId");

-- CreateIndex
CREATE INDEX "user_machines_machineId_idx" ON "user_machines"("machineId");
