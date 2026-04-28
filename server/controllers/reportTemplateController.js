// Get all report templates
// @route GET /api/report-templates
// @access Private (secretary only)
const { t } = require('../utils/i18n');
const getReportTemplates = async (req, res, next) => {
  try {
    const templates = await req.prisma.reportTemplate.findMany({
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' }
        },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

// Get report template by ID
// @route GET /api/report-templates/:id
// @access Private (secretary only)
const getReportTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await req.prisma.reportTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            department: { select: { id: true, name: true } }
          },
          orderBy: { displayOrder: 'asc' }
        },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!template) {
      return res.status(404).json({ message: t('template.notFound', req.language) });
    }
    res.json(template);
  } catch (error) {
    next(error);
  }
};

// Create a new report template
// @route POST /api/report-templates
// @access Private (secretary only)
const createReportTemplate = async (req, res, next) => {
  try {
    const { name, description, sections } = req.body;
    const createdById = req.user.id;

    if (!name || !sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ message: t('template.nameRequired', req.language) });
    }

    for (const section of sections) {
      if (!section.sectionName || !section.departmentId || section.displayOrder === undefined) {
        return res.status(400).json({ message: t('validation.requiredField', req.language) });
      }
    }

    const newTemplate = await req.prisma.$transaction(async (prisma) => {
      const reportTemplate = await prisma.reportTemplate.create({
        data: {
          name,
          description,
          createdById,
          sections: {
            create: sections.map(section => ({
              sectionName: section.sectionName,
              instructions: section.instructions,
              departmentId: section.departmentId,
              displayOrder: section.displayOrder
            }))
          }
        },
        include: {
          sections: {
            include: {
              department: { select: { id: true, name: true } }
            },
            orderBy: { displayOrder: 'asc' }
          },
          createdBy: { select: { id: true, name: true } }
        }
      });
      return reportTemplate;
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return res.status(400).json({ message: t('template.nameExists', req.language) });
    }
    // Handle foreign key constraint errors for departmentId if a department doesn't exist
    if (error.code === 'P2003' && error.meta?.field_name?.includes('departmentId')) {
        return res.status(400).json({ message: t('department.notFound', req.language) });
    }
    next(error);
  }
};

// Update a report template
// @route PUT /api/report-templates/:id
// @access Private (secretary only)
const updateReportTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, sections } = req.body;
    const userId = req.user.id; // For auditing if needed, though ReportTemplate doesn't have updatedById

    if (!name || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ message: t('template.nameRequired', req.language) });
    }

    for (const section of sections) {
      if (!section.sectionName || !section.departmentId || section.displayOrder === undefined) {
        return res.status(400).json({ message: t('validation.requiredField', req.language) });
      }
    }

    const updatedTemplate = await req.prisma.$transaction(async (prisma) => {
      // 1. Fetch the existing template with its current sections
      const existingTemplate = await prisma.reportTemplate.findUnique({
        where: { id },
        include: { sections: true },
      });

      if (!existingTemplate) {
        // This check will cause the transaction to rollback if template not found
        throw new Error('Report template not found'); 
      }

      // 2. Update basic template details
      const basicUpdatedTemplate = await prisma.reportTemplate.update({
        where: { id },
        data: {
          name,
          description,
          // updatedAt will be handled automatically by Prisma
        },
      });

      const existingSectionIds = existingTemplate.sections.map(s => s.id);
      const incomingSectionIds = sections.filter(s => s.id).map(s => s.id);

      // 3. Identify sections to delete
      const sectionsToDelete = existingSectionIds.filter(sid => !incomingSectionIds.includes(sid));
      if (sectionsToDelete.length > 0) {
        await prisma.reportTemplateSection.deleteMany({
          where: { id: { in: sectionsToDelete } },
        });
      }

      // 4. Update existing sections and create new ones
      for (const sectionData of sections) {
        if (sectionData.id) { // Existing section: update it
          await prisma.reportTemplateSection.update({
            where: { id: sectionData.id },
            data: {
              sectionName: sectionData.sectionName,
              instructions: sectionData.instructions,
              departmentId: sectionData.departmentId,
              displayOrder: sectionData.displayOrder,
            },
          });
        } else { // New section: create it
          await prisma.reportTemplateSection.create({
            data: {
              templateId: id, // Link to the parent template
              sectionName: sectionData.sectionName,
              instructions: sectionData.instructions,
              departmentId: sectionData.departmentId,
              displayOrder: sectionData.displayOrder,
            },
          });
        }
      }
      
      // 5. Fetch the fully updated template with its sections for the response
      return prisma.reportTemplate.findUnique({
        where: { id },
        include: {
          sections: {
            include: { department: { select: { id: true, name: true } } },
            orderBy: { displayOrder: 'asc' },
          },
          createdBy: { select: { id: true, name: true } },
        },
      });
    });

    res.json(updatedTemplate);
  } catch (error) {
    if (error.message === 'Report template not found') {
        return res.status(404).json({ message: t('template.notFound', req.language) });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return res.status(400).json({ message: t('template.nameExists', req.language) });
    }
    if (error.code === 'P2003' && error.meta?.field_name?.includes('departmentId')) {
        return res.status(400).json({ message: t('department.notFound', req.language) });
    }
    if (error.code === 'P2025') { // Catch errors from deleteMany or update if a section ID is invalid
        return res.status(400).json({ message: t('section.updateFailed', req.language) });
    }
    next(error);
  }
};

// Delete a report template
// @route DELETE /api/report-templates/:id
// @access Private (secretary only)
const deleteReportTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if any reports are actively using this template.
    // If so, we might want to prevent deletion or handle it differently (e.g., soft delete template).
    // For now, we'll allow deletion, and Prisma will set the templateId on Reports to null.
    const reportsUsingTemplate = await req.prisma.report.count({
      where: { templateId: id, isDeleted: false }, // Assuming you have an isDeleted flag on reports
    });

    // Note: If isDeleted is not on Report model, remove it from the query above.
    // If reportsUsingTemplate > 0, you might want to return a 400 error or implement soft delete for templates.
    // For this implementation, we proceed with deletion.

    await req.prisma.reportTemplate.delete({
      where: { id },
    });

    res.status(204).send(); // No content to send back
  } catch (error) {
    if (error.code === 'P2025') { // Prisma's 'Record to delete does not exist.'
      return res.status(404).json({ message: t('template.notFound', req.language) });
    }
    next(error);
  }
};

// Duplicate a report template
// @route POST /api/report-templates/:id/duplicate
// @access Private (secretary only)
const duplicateReportTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const createdById = req.user.id;

    // Get the original template with sections
    const originalTemplate = await req.prisma.reportTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!originalTemplate) {
      return res.status(404).json({ message: t('template.notFound', req.language) });
    }

    // Create the duplicate with a modified name
    const duplicatedTemplate = await req.prisma.$transaction(async (prisma) => {
      const newTemplate = await prisma.reportTemplate.create({
        data: {
          name: `${originalTemplate.name} (Copy)`,
          description: originalTemplate.description,
          createdById,
          sections: {
            create: originalTemplate.sections.map(section => ({
              sectionName: section.sectionName,
              instructions: section.instructions,
              departmentId: section.departmentId,
              displayOrder: section.displayOrder
            }))
          }
        },
        include: {
          sections: {
            include: {
              department: { select: { id: true, name: true } }
            },
            orderBy: { displayOrder: 'asc' }
          },
          createdBy: { select: { id: true, name: true } }
        }
      });
      return newTemplate;
    });

    res.status(201).json(duplicatedTemplate);
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      // If name already exists, try with a different suffix
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
      try {
        const originalTemplate = await req.prisma.reportTemplate.findUnique({
          where: { id: req.params.id },
          include: { sections: { orderBy: { displayOrder: 'asc' } } }
        });

        const duplicatedTemplate = await req.prisma.$transaction(async (prisma) => {
          const newTemplate = await prisma.reportTemplate.create({
            data: {
              name: `${originalTemplate.name} (Copy ${timestamp})`,
              description: originalTemplate.description,
              createdById: req.user.id,
              sections: {
                create: originalTemplate.sections.map(section => ({
                  sectionName: section.sectionName,
                  instructions: section.instructions,
                  departmentId: section.departmentId,
                  displayOrder: section.displayOrder
                }))
              }
            },
            include: {
              sections: {
                include: {
                  department: { select: { id: true, name: true } }
                },
                orderBy: { displayOrder: 'asc' }
              },
              createdBy: { select: { id: true, name: true } }
            }
          });
          return newTemplate;
        });
        return res.status(201).json(duplicatedTemplate);
      } catch (retryError) {
        return res.status(400).json({ message: t('template.createFailed', req.language) });
      }
    }
    next(error);
  }
};

module.exports = {
  getReportTemplates,
  getReportTemplateById,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  duplicateReportTemplate
};
