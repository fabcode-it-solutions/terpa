/*
  Warnings:

  - You are about to drop the column `ksn` on the `terminals` table. All the data in the column will be lost.
  - You are about to drop the column `rsa` on the `terminals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "terminals" DROP COLUMN "ksn",
DROP COLUMN "rsa";
