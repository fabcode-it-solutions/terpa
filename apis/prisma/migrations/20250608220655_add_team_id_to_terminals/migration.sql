-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
