-- CreateEnum
CREATE TYPE "LegalEntityType" AS ENUM ('PERSONA_FISICA', 'PERSONA_MORAL');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "legalEntityType" "LegalEntityType",
ADD COLUMN     "machineModelBrand" TEXT,
ADD COLUMN     "terminalSerialDigits" TEXT,
ADD COLUMN     "totalTerminals" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phoneNumber" TEXT;
