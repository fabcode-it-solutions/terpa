-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "machineId" TEXT NOT NULL,
    "machineProductCost" INTEGER NOT NULL,
    "machineProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_machineId_createdAt_idx" ON "sales"("machineId", "createdAt");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
