-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('VENDING', 'MICROMARKET');

-- AlterTable
ALTER TABLE "machine_spirals" ADD COLUMN     "machineMicromarketCode" TEXT;

-- AlterTable
ALTER TABLE "machines" ADD COLUMN     "type" "MachineType" NOT NULL DEFAULT 'VENDING';
