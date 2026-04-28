-- AlterTable
ALTER TABLE "ReportSection" ADD COLUMN     "reportTemplateSectionId" TEXT;

-- AddForeignKey
ALTER TABLE "ReportSection" ADD CONSTRAINT "ReportSection_reportTemplateSectionId_fkey" FOREIGN KEY ("reportTemplateSectionId") REFERENCES "ReportTemplateSection"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
