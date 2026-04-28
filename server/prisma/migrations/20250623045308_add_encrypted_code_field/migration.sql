/*
  Warnings:

  - Added the required column `codeEncrypted` to the `SharedReportLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SharedReportLink" ADD COLUMN     "codeEncrypted" TEXT NOT NULL;
