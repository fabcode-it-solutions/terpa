-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "machines_terminalSerialNumber_idx" ON "machines"("terminalSerialNumber");

-- CreateIndex
CREATE INDEX "machines_teamId_terminalSerialNumber_idx" ON "machines"("teamId", "terminalSerialNumber");
