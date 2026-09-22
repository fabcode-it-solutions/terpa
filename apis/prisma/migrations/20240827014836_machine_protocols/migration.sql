-- CreateEnum
CREATE TYPE "MachineProtocol" AS ENUM ('DEX', 'MDB');

-- AlterTable
ALTER TABLE "machines" ADD COLUMN     "protocol" "MachineProtocol" NOT NULL DEFAULT 'DEX';
