-- CreateEnum
CREATE TYPE "TeamDocumentType" AS ENUM ('BUSINESS_OPERATION_PROOF', 'LEGAL_REPRESENTATIVE_ID', 'TAX_SITUATION');

-- CreateTable
CREATE TABLE "team_documents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "teamId" TEXT NOT NULL,
    "type" "TeamDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_documents_teamId_type_idx" ON "team_documents"("teamId", "type");

-- AddForeignKey
ALTER TABLE "team_documents" ADD CONSTRAINT "team_documents_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
