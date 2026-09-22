-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "machineId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMPTZ,
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
