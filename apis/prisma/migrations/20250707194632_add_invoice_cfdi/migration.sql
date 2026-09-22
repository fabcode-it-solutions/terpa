-- CreateEnum
CREATE TYPE "CfdiStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "invoice_cfdis" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" TEXT NOT NULL,
    "facturamaId" TEXT,
    "status" "CfdiStatus" NOT NULL DEFAULT 'PENDING',
    "rawResponse" JSONB,
    "uuid" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_cfdis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_cfdis_invoiceId_key" ON "invoice_cfdis"("invoiceId");

-- AddForeignKey
ALTER TABLE "invoice_cfdis" ADD CONSTRAINT "invoice_cfdis_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
