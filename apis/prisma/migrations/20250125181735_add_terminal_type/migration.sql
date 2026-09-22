-- CreateEnum
CREATE TYPE "TerminalType" AS ENUM ('VENDING', 'PARKING');

-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "type" "TerminalType" NOT NULL DEFAULT 'VENDING';
