-- CreateTable
CREATE TABLE "machine_spirals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "machineId" TEXT NOT NULL,
    "machineCode" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "machine_spirals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machine_spirals_machineId_idx" ON "machine_spirals"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "machine_spirals_machineId_machineCode_key" ON "machine_spirals"("machineId", "machineCode");

-- AddForeignKey
ALTER TABLE "machine_spirals" ADD CONSTRAINT "machine_spirals_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_spirals" ADD CONSTRAINT "machine_spirals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
