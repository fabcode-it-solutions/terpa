-- CreateEnum
CREATE TYPE "terminal_flow_types" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "terminal_languages" AS ENUM ('ES', 'EN');

-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "acceptCashPayments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptCreditPayments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "decimalMode" DECIMAL(65,30) NOT NULL DEFAULT 1,
ADD COLUMN     "flowType" "terminal_flow_types" NOT NULL DEFAULT 'A',
ADD COLUMN     "initialCredit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "language" "terminal_languages" NOT NULL DEFAULT 'ES';
