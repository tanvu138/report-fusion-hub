-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('OFFICIAL', 'PERSONAL');

-- DropForeignKey
ALTER TABLE "ReportSection" DROP CONSTRAINT "ReportSection_departmentId_fkey";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "type" "ReportType" NOT NULL DEFAULT 'OFFICIAL';

-- AlterTable
ALTER TABLE "ReportSection" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ReportSection" ADD CONSTRAINT "ReportSection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
