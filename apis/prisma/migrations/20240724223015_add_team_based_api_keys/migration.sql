-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
