-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('PASSWORD_RESET', 'TEAM_WELCOME', 'PAYMENT_REMINDER', 'DOCUMENT_NOTIFICATION');

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "type" "EmailType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
