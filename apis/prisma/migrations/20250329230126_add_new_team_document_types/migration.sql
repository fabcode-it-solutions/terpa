-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TeamDocumentType" ADD VALUE 'ARTICLES_OF_INCORPORATION';
ALTER TYPE "TeamDocumentType" ADD VALUE 'PUBLIC_REGISTRY_REGISTRATION';
ALTER TYPE "TeamDocumentType" ADD VALUE 'LEGAL_ENTITY_TAX_SITUATION';
ALTER TYPE "TeamDocumentType" ADD VALUE 'LEGAL_ENTITY_PROOF_OF_ADDRESS';
ALTER TYPE "TeamDocumentType" ADD VALUE 'LEGAL_ENTITY_BANK_STATEMENT';
