-- CreateTable
CREATE TABLE "user_machines" (
    "userId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_machines_pkey" PRIMARY KEY ("userId","machineId")
);

-- AddForeignKey
ALTER TABLE "user_machines" ADD CONSTRAINT "user_machines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_machines" ADD CONSTRAINT "user_machines_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
