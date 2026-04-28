/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ReportTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_name_key" ON "ReportTemplate"("name");
