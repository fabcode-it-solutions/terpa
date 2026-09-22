/*
  Warnings:

  - Added the required column `status` to the `email_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "status" "EmailStatus" NOT NULL;
