const { Prisma } = require('@prisma/client');

/**
 * Updates the content of multiple sections within a single report as a batch operation.
 * This is intended for a 'full edit' mode where a secretary can edit all sections at once.
 *
 * @param {object} prisma - The Prisma client instance.
 * @param {string} reportId - The ID of the report whose sections are to be updated.
 * @param {Array<{id: string, contentMarkdown: string}>} sectionsData - An array of section objects, each containing the section ID and its new markdown content.
 * @param {string} userId - The ID of the user performing the update.
 * @returns {Promise<object>} The updated report object with its sections.
 * @throws {Error} If the report is not found, or if any section is locked or doesn't belong to the report.
 */
const updateFullReportContent = async (prisma, reportId, sectionsData, userId) => {
  if (!reportId || !sectionsData || !Array.isArray(sectionsData) || sectionsData.length === 0 || !userId) {
    throw new Error('Invalid arguments: reportId, sectionsData array, and userId are required.');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify the report exists and is not in a state that prevents editing (e.g., FINALIZED).
    const report = await tx.report.findUnique({
      where: { id: reportId, type: 'OFFICIAL' },
      select: { id: true, state: true },
    });

    if (!report) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }

    // Add business rule: prevent editing if report is FINALIZED or any other terminal state
    // For now, we'll assume only FINAL means no edits. This can be expanded.
    if (report.state === 'FINAL') {
      throw new Error(`Report with ID ${reportId} is finalized and cannot be edited.`);
    }

    // 2. Process each section update
    for (const sectionUpdate of sectionsData) {
      if (!sectionUpdate.id || typeof sectionUpdate.contentMarkdown !== 'string') {
        throw new Error('Invalid section data: Each section must have an id and contentMarkdown string.');
      }

      const section = await tx.reportSection.findUnique({
        where: { id: sectionUpdate.id },
        select: { id: true, reportId: true, locked: true },
      });

      if (!section) {
        throw new Error(`Section with ID ${sectionUpdate.id} not found.`);
      }

      if (section.reportId !== reportId) {
        throw new Error(`Section with ID ${sectionUpdate.id} does not belong to report ${reportId}.`);
      }

      if (section.locked) {
        throw new Error(`Section with ID ${sectionUpdate.id} is locked and cannot be edited.`);
      }

      await tx.reportSection.update({
        where: { id: sectionUpdate.id },
        data: {
          contentMarkdown: sectionUpdate.contentMarkdown,
          updatedById: userId,
          // state could be reset to DRAFT if business rules require it upon edit
          // For now, we leave state as is, assuming only content changes.
          // state: 'DRAFT', 
        },
      });
    }

    // 3. Return the updated report with its sections (or just a success indicator)
    // Fetching the full report again to reflect changes.
    const updatedReport = await tx.report.findUnique({
      where: { id: reportId },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            department: true,
            updatedBy: { select: { id: true, name: true } },
            // Include template details if needed for display
            reportTemplateSection: {
              select: { id: true, sectionName: true, sectionKey: true }
            }
          }
        }
      }
    });
    
    return updatedReport;
  });
};

module.exports = {
  updateFullReportContent,
};
