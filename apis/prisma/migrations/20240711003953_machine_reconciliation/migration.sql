-- CreateTable
CREATE TABLE "machine_reconciliations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "cashBoxValueCents" INTEGER NOT NULL,
    "reconciliationValue" INTEGER NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_reconciliations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "machine_reconciliations" ADD CONSTRAINT "machine_reconciliations_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_reconciliations" ADD CONSTRAINT "machine_reconciliations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
