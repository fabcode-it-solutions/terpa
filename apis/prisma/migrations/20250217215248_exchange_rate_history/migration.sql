-- CreateTable
CREATE TABLE "exchange_rate_history" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rate_history_createdAt_idx" ON "exchange_rate_history"("createdAt");
