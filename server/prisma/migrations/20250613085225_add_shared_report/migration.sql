-- CreateEnum
CREATE TYPE "SharedReportAccess" AS ENUM ('VIEW', 'COMMENT');

-- CreateTable
CREATE TABLE "TemplatePack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplatePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplatePackItem" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "TemplatePackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedReportLink" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "accessLevel" "SharedReportAccess" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedReportLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePack_name_key" ON "TemplatePack"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePackItem_packId_templateId_key" ON "TemplatePackItem"("packId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePackItem_packId_displayOrder_key" ON "TemplatePackItem"("packId", "displayOrder");

-- CreateIndex
CREATE INDEX "SharedReportLink_reportId_idx" ON "SharedReportLink"("reportId");

-- AddForeignKey
ALTER TABLE "TemplatePackItem" ADD CONSTRAINT "TemplatePackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "TemplatePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplatePackItem" ADD CONSTRAINT "TemplatePackItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedReportLink" ADD CONSTRAINT "SharedReportLink_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedReportLink" ADD CONSTRAINT "SharedReportLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
