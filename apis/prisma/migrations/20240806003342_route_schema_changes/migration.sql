/*
  Warnings:

  - Added the required column `teamId` to the `routes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "deletedAt" TIMESTAMPTZ,
ADD COLUMN     "teamId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
