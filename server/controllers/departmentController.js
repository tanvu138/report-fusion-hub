const departmentService = require('../services/departmentService');
const { PrismaClient } = require('@prisma/client'); // Keep for existing class methods if they use it directly
const prisma = new PrismaClient(); // Keep for existing class methods
const { t } = require('../utils/i18n');

async function listDepartmentsHandler(req, res) {
  try {
    const departments = await departmentService.getAllDepartments();
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error in listDepartmentsHandler:', error.message);
    res.status(500).json({ error: t('department.retrieveFailed', req.language) });
  }
}

async function getDepartmentByIdHandler(req, res) {
  try {
    const { departmentId } = req.params;
    const department = await departmentService.getDepartmentById(departmentId);
    if (!department) {
      return res.status(404).json({ error: t('department.notFound', req.language) });
    }
    res.status(200).json(department);
  } catch (error) {
    console.error('Error in getDepartmentByIdHandler:', error.message);
    if (error.message.includes('is required')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: t('department.retrieveFailed', req.language) });
  }
}

async function updateDepartmentHandler(req, res) {
  try {
    const { departmentId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: t('department.nameRequired', req.language) });
    }

    const updatedDepartment = await departmentService.updateDepartment(departmentId, name);
    res.status(200).json(updatedDepartment);
  } catch (error) {
    console.error('Error in updateDepartmentHandler:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('is required')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: t('department.updateFailed', req.language) });
  }
}

async function deleteDepartmentHandler(req, res) {
  try {
    const { departmentId } = req.params;
    await departmentService.deleteDepartment(departmentId);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error in deleteDepartmentHandler:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.startsWith('Cannot delete department.')) { // Dependency conflict
      return res.status(409).json({ error: error.message });
    }
     if (error.message.includes('is required')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: t('department.deleteFailed', req.language) });
  }
}

async function createDepartmentHandler(req, res) {
  try {
    const { name, username, initialPassword, email } = req.body; // Destructure username and email
    if (!name) {
      return res.status(400).json({ error: t('department.nameRequired', req.language) });
    }

    const result = await departmentService.createDepartment(name, username, initialPassword, email); // Pass username and email
    // The service returns { department, newUser (optional, password excluded), initialPassword (optional) }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createDepartmentHandler:', error.message);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message }); // 409 Conflict
    }
    if (error.message.includes('is required') || error.message.includes('must be a non-empty string')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: t('department.createFailed', req.language) });
  }
}

class DepartmentController {
  // Get all departments (refactored to use service)
  async getDepartments(req, res) {
    try {
      // This route is likely for general listing, let's use the service method
      const departments = await departmentService.getAllDepartments();
      res.status(200).json(departments);
    } catch (error) {
      console.error('Error fetching departments (controller):', error.message);
      res.status(500).json({ error: t('department.retrieveFailed', req.language) });
    }
  }

  // Get sections assigned to user's department
  async getMySections(req, res) {
    try {
      const { departmentId } = req.user;

      if (!departmentId) {
        return res.status(400).json({ 
          error: t('user.departmentRequired', req.language) 
        });
      }

      // Get all sections for the department
      const sections = await prisma.reportSection.findMany({
        where: {
          departmentId,
          isActive: true,
          report: {
            isDeleted: false,
            state: { not: 'FINAL' } // Don't show sections from finalized reports
          }
        },
        include: {
          report: {
            select: {
              id: true,
              title: true,
              cycle: true,
              dueAt: true,
              state: true
            }
          },
          updatedBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { dueAt: 'asc' },
          { report: { createdAt: 'desc' } },
          { displayOrder: 'asc' }
        ]
      });

      // Group sections by report
      const sectionsByReport = sections.reduce((acc, section) => {
        const reportId = section.report.id;
        if (!acc[reportId]) {
          acc[reportId] = {
            report: section.report,
            sections: []
          };
        }
        acc[reportId].sections.push({
          id: section.id,
          sectionName: section.sectionName,
          instructions: section.instructions,
          state: section.state,
          dueAt: section.dueAt,
          submittedAt: section.submittedAt,
          locked: section.locked,
          contentMarkdown: section.contentMarkdown,
          updatedBy: section.updatedBy,
          displayOrder: section.displayOrder
        });
        return acc;
      }, {});

      res.json(Object.values(sectionsByReport));
    } catch (error) {
      console.error('Error fetching department sections:', error.message);
      res.status(500).json({ error: t('section.retrieveFailed', req.language) });
    }
  }

  // Get pending sections (not yet submitted)
  async getMyPendingSections(req, res) {
    try {
      const { departmentId } = req.user;

      if (!departmentId) {
        return res.status(400).json({ 
          error: t('user.departmentRequired', req.language) 
        });
      }

      const sections = await prisma.reportSection.findMany({
        where: {
          departmentId,
          isActive: true,
          state: 'DRAFT',
          report: {
            isDeleted: false,
            state: { not: 'FINAL' }
          }
        },
        include: {
          report: {
            select: {
              id: true,
              title: true,
              cycle: true,
              dueAt: true
            }
          }
        },
        orderBy: [
          { dueAt: 'asc' },
          { report: { createdAt: 'desc' } }
        ]
      });

      res.json(sections);
    } catch (error) {
      console.error('Error fetching pending sections:', error.message);
      res.status(500).json({ error: t('section.retrieveFailed', req.language) });
    }
  }

  // Get a specific section by ID (with access control)
  async getSection(req, res) {
    try {
      const { sectionId } = req.params;
      const { departmentId, role } = req.user;

      const section = await prisma.reportSection.findUnique({
        where: { id: sectionId },
        include: {
          department: true,
          report: {
            select: {
              id: true,
              title: true,
              cycle: true,
              dueAt: true,
              state: true
            }
          },
          updatedBy: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (!section) {
        return res.status(404).json({ error: t('section.notFound', req.language) });
      }

      // Access control: department users can only see their own sections
      if (role === 'department' && section.departmentId !== departmentId) {
        return res.status(403).json({ error: t('auth.insufficientPermissions', req.language) });
      }

      res.json(section);
    } catch (error) {
      console.error('Error fetching section:', error.message);
      res.status(500).json({ error: t('section.retrieveFailed', req.language) });
    }
  }

  // Update section content (department users can only update their own)
  async updateSectionContent(req, res) {
    try {
      const { sectionId } = req.params;
      const { contentMarkdown } = req.body;
      const { departmentId, role, id: userId } = req.user;

      // Get the section
      const section = await prisma.reportSection.findUnique({
        where: { id: sectionId },
        include: {
          report: true
        }
      });

      if (!section) {
        return res.status(404).json({ error: t('section.notFound', req.language) });
      }

      // Access control
      if (role === 'department' && section.departmentId !== departmentId) {
        return res.status(403).json({ error: t('auth.insufficientPermissions', req.language) });
      }

      // Check if section is locked or report is finalized
      if (section.locked || section.report.state === 'FINAL') {
        return res.status(400).json({ 
          error: t('section.cannotModifyFinalized', req.language) 
        });
      }

      // Update the section
      const updatedSection = await prisma.reportSection.update({
        where: { id: sectionId },
        data: {
          contentMarkdown,
          updatedById: userId,
          updatedAt: new Date()
        },
        include: {
          department: true,
          updatedBy: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      res.json(updatedSection);
    } catch (error) {
      console.error('Error updating section:', error.message);
      res.status(500).json({ error: t('section.updateFailed', req.language) });
    }
  }

  // Submit a section (mark as submitted)
  async submitSection(req, res) {
    try {
      const { sectionId } = req.params;
      const { departmentId, role, id: userId } = req.user;

      // Get the section
      const section = await prisma.reportSection.findUnique({
        where: { id: sectionId },
        include: {
          report: true
        }
      });

      if (!section) {
        return res.status(404).json({ error: t('section.notFound', req.language) });
      }

      // Access control
      if (role === 'department' && section.departmentId !== departmentId) {
        return res.status(403).json({ error: t('auth.insufficientPermissions', req.language) });
      }

      // Check if already submitted or report is finalized
      if (section.state === 'SUBMITTED') {
        return res.status(400).json({ error: t('section.cannotModifyFinalized', req.language) });
      }

      if (section.report.state === 'FINAL') {
        return res.status(400).json({ error: t('section.cannotModifyFinalized', req.language) });
      }

      // Check if content exists
      if (!section.contentMarkdown || section.contentMarkdown.trim() === '') {
        return res.status(400).json({ 
          error: t('section.contentRequired', req.language) 
        });
      }

      // Submit the section
      const submittedSection = await prisma.reportSection.update({
        where: { id: sectionId },
        data: {
          state: 'SUBMITTED',
          submittedAt: new Date(),
          updatedById: userId
        },
        include: {
          department: true,
          report: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      res.json({
        message: t('section.updateSuccessful', req.language),
        section: submittedSection
      });
    } catch (error) {
      console.error('Error submitting section:', error.message);
      res.status(500).json({ error: t('section.updateFailed', req.language) });
    }
  }
}

module.exports = {
  createDepartmentHandler,
  listDepartmentsHandler,
  getDepartmentByIdHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
  // And then export the class instance for existing routes
  DepartmentControllerInstance: new DepartmentController()
};
