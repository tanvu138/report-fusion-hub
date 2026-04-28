/*
  Warnings:

  - The values [LEAD,DEPT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `templateId` on the `ReportSection` table. All the data in the column will be lost.
  - You are about to drop the `SectionTemplate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[reportId,displayOrder]` on the table `ReportSection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `departmentId` to the `ReportSection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionName` to the `ReportSection` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SectionState" AS ENUM ('DRAFT', 'SUBMITTED');

-- AlterEnum
ALTER TYPE "ReportState" ADD VALUE 'FINAL';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('secretary', 'department');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'department';
COMMIT;

-- DropForeignKey
ALTER TABLE "ReportSection" DROP CONSTRAINT "ReportSection_templateId_fkey";

-- DropForeignKey
ALTER TABLE "SectionTemplate" DROP CONSTRAINT "SectionTemplate_departmentId_fkey";

-- DropIndex
DROP INDEX "ReportSection_reportId_templateId_key";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "ReportSection" DROP COLUMN "templateId",
ADD COLUMN     "departmentId" TEXT NOT NULL,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sectionName" TEXT NOT NULL,
ADD COLUMN     "state" "SectionState" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'department';

-- DropTable
DROP TABLE "SectionTemplate";

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplateSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "instructions" TEXT,
    "departmentId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "ReportTemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplateSection_templateId_displayOrder_key" ON "ReportTemplateSection"("templateId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSection_reportId_displayOrder_key" ON "ReportSection"("reportId", "displayOrder");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSection" ADD CONSTRAINT "ReportSection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplateSection" ADD CONSTRAINT "ReportTemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplateSection" ADD CONSTRAINT "ReportTemplateSection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
