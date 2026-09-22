-- CreateTable
CREATE TABLE "machine_picklists" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "machineId" TEXT NOT NULL,
    "fulfilledAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_picklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picklist_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "picklistId" TEXT NOT NULL,
    "machineSpiralId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "picklist_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "machine_picklists" ADD CONSTRAINT "machine_picklists_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picklist_items" ADD CONSTRAINT "picklist_items_picklistId_fkey" FOREIGN KEY ("picklistId") REFERENCES "machine_picklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picklist_items" ADD CONSTRAINT "picklist_items_machineSpiralId_fkey" FOREIGN KEY ("machineSpiralId") REFERENCES "machine_spirals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
