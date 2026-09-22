-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "endpointUrl" TEXT,
ADD COLUMN     "extra1" TEXT,
ADD COLUMN     "extra2" TEXT,
ADD COLUMN     "fixedComissionCents" INTEGER,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "percentageCommission" DECIMAL(65,30),
ADD COLUMN     "username" TEXT;
