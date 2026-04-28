/**
 * Section Controller
 * 
 * This controller handles all section-related operations:
 * - Get sections for a specific report
 * - Update section content (markdown)
 * - Toggle section activation status
 * 
 * Access control is enforced to ensure:
 * - secretary users can access all sections
 * - department users can only access sections for their department
 */
const { t } = require('../utils/i18n');

/**
 * Get all sections for a report
 * 
 * @route GET /api/reports/:id/sections
 * @requires authentication
 * @param {string} req.params.id - Report ID
 * @returns {object[]} List of sections with department info
 */
const getReportSections = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, departmentId } = req.user;
    
    // Build filter based on user role
    const filter = {
      reportId: id,
      // For department users, filter to only their department's sections
      ...(role === 'department' && {
        departmentId
      })
    };
    
    // Get sections with department and updatedBy info
    const sections = await req.prisma.reportSection.findMany({
      where: filter,
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        department: {
          name: 'asc'
        }
      }
    });
    
    res.json(sections);
  } catch (error) {
    next(error);
  }
};

/**
 * Update section content
 * 
 * @route PUT /api/reports/:id/sections/:sectionId
 * @requires authentication and department authorization
 * @param {string} req.params.id - Report ID
 * @param {string} req.params.sectionId - Section ID
 * @param {object} req.body - Section data
 * @param {string} req.body.contentMarkdown - Markdown content
 * @returns {object} Updated section
 */
const updateSectionContent = async (req, res, next) => {
  try {
    const { id: reportId, sectionId } = req.params; // Renamed 'id' to 'reportId' for clarity
    const { contentMarkdown } = req.body;
    const { id: userId, role: userRole } = req.user;

    // The authorizeDepartmentForSection middleware should have already fetched the section
    // and attached it to req.section. If not, or for robustness, we can fetch it again.
    // However, it's better to rely on the middleware to provide req.section.
    // For this implementation, we assume req.section is populated by the middleware.
    // If req.section is not populated, this will fail. A more robust check could be added.

    const currentSection = await req.prisma.reportSection.findUnique({
      where: { id: sectionId },
      include: { report: true }, // Include the parent report
    });

    if (!currentSection) {
      return res.status(404).json({ message: t('section.notFound', req.language) });
    }

    if (currentSection.reportId !== reportId) {
      return res.status(400).json({ message: t('validation.invalidInput', req.language) });
    }

    const { report } = currentSection; // Parent report from the included relation

    // Check 1: Report finalized
    if (report.state === 'FINAL') {
      return res.status(403).json({ message: t('section.cannotModifyFinalized', req.language) });
    }

    // Check 2: Section locked
    if (currentSection.locked) {
      return res.status(403).json({ message: t('section.cannotModifyFinalized', req.language) });
    }

    // Check 3: Department user trying to edit a submitted section
    if (userRole === 'department' && currentSection.state === 'SUBMITTED') {
      return res.status(403).json({ message: t('section.cannotModifyFinalized', req.language) });
    }

    const dataToUpdate = {
      contentMarkdown,
      updatedById: userId,
    };

    // If a secretary edits a submitted section, revert its state to DRAFT
    if (userRole === 'secretary' && currentSection.state === 'SUBMITTED') {
      dataToUpdate.state = 'DRAFT';
      dataToUpdate.submittedAt = null;
    }

    const updatedSection = await req.prisma.reportSection.update({
      where: {
        id: sectionId,
      },
      data: dataToUpdate,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        report: {
          select: {
            id: true,
            state: true, // Include report state for context if needed
          }
        }
      },
    });

    res.json(updatedSection);
  } catch (error) {
    if (error.code === 'P2025') {
      // This specific error might be less likely now given the initial findUnique
      return res.status(404).json({ message: t('section.notFound', req.language) });
    }
    next(error);
  }
};

/**
 * Toggle section activation status (secretary role only)
 * 
 * @route PATCH /api/reports/:id/sections/:sectionId/active
 * @requires authentication with secretary role
 * @param {string} req.params.id - Report ID
 * @param {string} req.params.sectionId - Section ID
 * @param {object} req.body - Section data
 * @param {boolean} req.body.isActive - New activation status
 * @returns {object} Updated section
 */
const toggleSectionActive = async (req, res, next) => {
  try {
    const { id, sectionId } = req.params;
    const { isActive } = req.body;
    
    // Update section activation status
    const section = await req.prisma.reportSection.update({
      where: { 
        id: sectionId,
        reportId: id // Ensure section belongs to the report
      },
      data: {
        isActive
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json(section);
  } catch (error) {
    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return res.status(404).json({ message: t('section.notFound', req.language) });
    }
    next(error);
  }
};

/**
 * Submit a section (department users)
 * 
 * @route PUT /api/reports/:id/sections/:sectionId/submit
 * @requires authentication and department authorization
 * @param {string} req.params.id - Report ID
 * @param {string} req.params.sectionId - Section ID
 * @returns {object} Updated section
 */
const submitSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { id: userId } = req.user;

    // Get section to check current state and lock status
    const section = await req.prisma.reportSection.findUnique({
      where: { id: sectionId },
      include: {
        report: true,
        department: true
      }
    });

    if (!section) {
      return res.status(404).json({ message: t('section.notFound', req.language) });
    }

    if (section.locked) {
      return res.status(400).json({ message: t('section.cannotModifyFinalized', req.language) });
    }

    if (section.state === 'SUBMITTED') {
      return res.status(400).json({ message: t('section.cannotModifyFinalized', req.language) });
    }

    if (!section.contentMarkdown || section.contentMarkdown.trim() === '') {
      return res.status(400).json({ 
        message: t('section.contentRequired', req.language) 
      });
    }

    // Update section state to SUBMITTED
    const updatedSection = await req.prisma.reportSection.update({
      where: { id: sectionId },
      data: {
        state: 'SUBMITTED',
        submittedAt: new Date(),
        updatedById: userId
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedSection);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportSections,
  updateSectionContent,
  toggleSectionActive,
  submitSection
};
