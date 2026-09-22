-- AlterTable
ALTER TABLE "team_documents" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMPTZ;
