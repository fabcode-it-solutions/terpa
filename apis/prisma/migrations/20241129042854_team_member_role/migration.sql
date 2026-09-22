-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('OWNER', 'OPERATOR');

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "role" "TeamMemberRole" NOT NULL DEFAULT 'OWNER';
