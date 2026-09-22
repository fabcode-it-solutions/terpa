/*
  Warnings:

  - Added the required column `ksn` to the `terminals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rsa` to the `terminals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "description" TEXT,
ADD COLUMN     "ksn" TEXT NOT NULL,
ADD COLUMN     "rsa" TEXT NOT NULL;
