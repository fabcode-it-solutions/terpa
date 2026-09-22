-- CreateTable
CREATE TABLE "terminals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serialNumber" TEXT NOT NULL,
    "pharosTerminalCode" TEXT NOT NULL,
    "pharosMerchantCode" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terminals_serialNumber_key" ON "terminals"("serialNumber");
