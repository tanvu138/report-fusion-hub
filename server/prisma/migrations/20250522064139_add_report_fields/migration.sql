-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
