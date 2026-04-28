/**
 * Template Pack Controller
 * 
 * This controller handles all template pack operations:
 * - List template packs
 * - Create new template packs (secretary only)
 * - Create reports from template packs
 * - Update template pack items
 */
const { t } = require('../utils/i18n');

/**
 * Get all template packs
 * 
 * @route GET /api/template-packs
 * @requires authentication
 * @returns {object[]} List of template packs with their items
 */
const getTemplatePacks = async (req, res, next) => {
  try {
    const templatePacks = await req.prisma.templatePack.findMany({
      include: {
        items: {
          include: {
            template: {
              include: {
                department: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(templatePacks);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new template pack (secretary only)
 * 
 * @route POST /api/template-packs
 * @requires authentication with secretary role
 * @param {object} req.body - Template pack data
 * @param {string} req.body.name - Pack name
 * @param {string} [req.body.description] - Pack description
 * @param {array} req.body.templateIds - Array of template IDs with display order
 * @returns {object} Created template pack
 */
const createTemplatePack = async (req, res, next) => {
  try {
    const { name, description, templateIds } = req.body;

    // Create the template pack
    const templatePack = await req.prisma.templatePack.create({
      data: {
        name,
        description,
        items: {
          create: templateIds.map((templateId, index) => ({
            templateId,
            displayOrder: index + 1
          }))
        }
      },
      include: {
        items: {
          include: {
            template: {
              include: {
                department: true
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      }
    });

    res.status(201).json(templatePack);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: t('templatePack.nameExists', req.language) });
    }
    next(error);
  }
};

/**
 * Create a report from a template pack
 * 
 * @route POST /api/reports/from-pack/:packId
 * @requires authentication with secretary role
 * @param {string} req.params.packId - Template pack ID
 * @param {object} req.body - Report data
 * @param {string} req.body.title - Report title
 * @param {string} req.body.cycle - Report cycle
 * @param {string} req.body.dueAt - Report due date
 * @param {string} [req.body.description] - Report description
 * @returns {object} Created report with sections
 */
const createReportFromPack = async (req, res, next) => {
  try {
    const { packId } = req.params;
    const { title, cycle, dueAt, description } = req.body;
    const { id: userId } = req.user;

    // Get template pack with items, including nested report templates and their sections
    const templatePack = await req.prisma.templatePack.findUnique({
      where: { id: packId },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' }, // Order pack items
          include: {
            template: { // This is the ReportTemplate
              include: {
                sections: { // These are ReportTemplateSections
                  orderBy: { displayOrder: 'asc' } // Order sections within each template
                }
              }
            }
          }
        }
      }
    });

    if (!templatePack) {
      return res.status(404).json({ message: t('templatePack.notFound', req.language) });
    }

    // Calculate section due date (default to 5 days before report due date)
    const reportDueDate = new Date(dueAt);
    const sectionDueDate = new Date(reportDueDate.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Create report with sections in a transaction
    const result = await req.prisma.$transaction(async (prisma) => {
      // Create the report
      const report = await prisma.report.create({
        data: {
          title,
          cycle,
          dueAt: reportDueDate,
          description,
          createdById: userId,
          // Link to the first template in the pack, if any
          templateId: templatePack.items.length > 0 ? templatePack.items[0].templateId : null,
          state: 'DRAFT' // Explicitly set initial state
        }
      });

      let globalSectionDisplayOrder = 0;
      const createdSections = [];

      for (const packItem of templatePack.items) {
        if (packItem.template && packItem.template.sections) {
          for (const templateSection of packItem.template.sections) {
            globalSectionDisplayOrder++;
            const newReportSection = await prisma.reportSection.create({
              data: {
                reportId: report.id,
                sectionName: templateSection.sectionName,
                instructions: templateSection.instructions,
                departmentId: templateSection.departmentId,
                reportTemplateSectionId: templateSection.id, // Link to the original ReportTemplateSection
                dueAt: sectionDueDate,
                displayOrder: globalSectionDisplayOrder,
                isActive: true,
                state: 'DRAFT' // Initial state for sections
              }
            });
            createdSections.push(newReportSection);
          }
        }
      }
      return { report, sections: createdSections };
    });

    // Fetch the complete report with sections for response
    const fullReport = await req.prisma.report.findUnique({
      where: { id: result.report.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } }, // The overall template linked to the report (if any)
        sections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            department: { select: { id: true, name: true } }, // Department assigned to this ReportSection
            reportTemplateSection: { // The ReportTemplateSection this ReportSection was created from
              select: {
                id: true,
                sectionName: true,
                department: { select: { id: true, name: true } } // Department of the original template section
              }
            },
            updatedBy: { select: { id: true, name: true } }
          }
        }
      }
    });

    res.status(201).json(fullReport);
  } catch (error) {
    next(error);
  }
};

/**
 * Update template pack items (secretary only)
 * 
 * @route PUT /api/template-packs/:id/items
 * @requires authentication with secretary role
 * @param {string} req.params.id - Template pack ID
 * @param {array} req.body.templateIds - Array of template IDs with new order
 * @returns {object} Updated template pack
 */
const updateTemplatePackItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { templateIds } = req.body;

    // Update template pack items in a transaction
    const templatePack = await req.prisma.$transaction(async (prisma) => {
      // Delete existing items
      await prisma.templatePackItem.deleteMany({
        where: { packId: id }
      });

      // Create new items
      await prisma.templatePackItem.createMany({
        data: templateIds.map((templateId, index) => ({
          packId: id,
          templateId,
          displayOrder: index + 1
        }))
      });

      // Return updated pack
      return prisma.templatePack.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              template: {
                include: {
                  department: true
                }
              }
            },
            orderBy: {
              displayOrder: 'asc'
            }
          }
        }
      });
    });

    if (!templatePack) {
      return res.status(404).json({ message: t('templatePack.notFound', req.language) });
    }

    res.json(templatePack);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplatePacks,
  createTemplatePack,
  createReportFromPack,
  updateTemplatePackItems
};
