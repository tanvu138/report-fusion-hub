/**
 * Report Controller
 * 
 * This controller handles all report-related operations:
 * - List reports (filtered by user role)
 * - Create new reports (secretary role only)
 * - Get report details
 * - Update report metadata
 * 
 * Reports are filtered based on user role:
 * - secretary users see all reports
 * - department users see reports where their department has active sections
 */
const reportService = require('../services/reportService');
const { t } = require('../utils/i18n');

/**
 * Get all reports (filtered by user role)
 * 
 * @route GET /api/reports
 * @requires authentication
 * @param {object} req.query - Query parameters for filtering/pagination
 * @returns {object} Paginated list of reports
 */
const getReports = async (req, res, next) => {
  try {
    // Get user and request info
    
    const { role, departmentId } = req.user || {};
    const { page = 1, limit = 10, state, cycle } = req.query;

    // Check if user is properly authenticated
    if (!req.user) {
      console.error('[getReports] No user found in request');
      return res.status(401).json({
        error: t('auth.required', req.language),
        details: 'Request is missing authenticated user information'
      });
    }

    // Validate numeric pagination params
    const pageNum = Math.max(1, parseInt(page, 10)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      where: { isDeleted: false, type: 'OFFICIAL' },
      include: {
        sections: {
          where: { isActive: true },
          include: {
            department: { select: { id: true, name: true } } // Include department directly from ReportSection
            // TEMPORARILY REMOVED: template include was causing issues
            // template: {
            //   select: { displayName: true, key: true, departmentId: true }
            // }
          }
        }
      }
    };

    // State/cycle filters
    if (state) filter.where.state = state;
    if (cycle) filter.where.cycle = cycle;

    // Department filtering
    if (role === 'department') {
      // Ensure departmentId exists for department users
      if (!departmentId) {
        // Return a clear error instead of causing Prisma to throw
        return res.status(400).json({
          error: t('user.departmentRequired', req.language),
          details: 'Department users must be linked to a department to view their reports.'
        });
      }
      // Filter reports where at least one active section belongs to the user's department
      filter.where.sections = {
        some: {
          departmentId: departmentId,
          isActive: true
        }
      };
    }

    // Execute query with pagination
    
    // Get paginated results
    let totalCount = 0;
    let reports = [];
    
    try {
      // First check if any non-deleted reports exist at all
      const reportExists = await req.prisma.report.findFirst({
        where: { isDeleted: false, type: 'OFFICIAL' },
        select: { id: true }
      });
      
      // Check if any reports exist
      
      if (!reportExists) {
        return res.status(404).json({
          error: t('general.notFound', req.language),
          details: 'The database appears to be empty of reports. Consider seeding some test data.'
        });
      }
      
      // Get actual reports with pagination and filtering
      [totalCount, reports] = await Promise.all([
        req.prisma.report.count({ where: filter.where }),
        req.prisma.report.findMany({
          ...filter,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        })
      ]);
      
      // Query executed successfully
      
    } catch (prismaError) {
      console.error('[getReports] Prisma query error:', prismaError.message);
      throw new Error(`Database query failed: ${prismaError.message}`);
    }

    if (!reports?.length) {
      // No reports found with applied filters
      return res.status(404).json({
        error: t('general.notFound', req.language)
      });
    }

    res.json({
      reports: reports.map(r => ({
        ...r,
        sectionCount: r.sections.length,
        _progress: {
          total: r.sections.length,
          submitted: r.sections.filter(s => s.state === 'SUBMITTED').length,
          active: r.sections.filter(s => s.isActive).length
        }
      })),
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    // Log error for debugging (removed detailed error info)
    console.error('[ReportController] getReports error:', error.message);
    // Use global error handler instead of inline error details
    next(error);
  }
};

/**
 * Create a new report (secretary role only)
 * 
 * @route POST /api/reports
 * @requires authentication with secretary role
 * @param {object} req.body - Report data
 * @param {string} req.body.title - Report title
 * @param {string} req.body.cycle - Report cycle (WEEKLY, MONTHLY, ADHOC)
 * @param {string[]} [req.body.departmentIds] - Array of department IDs to include
 * @param {string} [req.body.description] - Optional report description
 * @returns {object} Created report with sections
 */
const createReport = async (req, res, next) => {
  // Process create report request
  
  // Start a Prisma transaction for atomic operations
  return await req.prisma.$transaction(async (prisma) => {
    try {
      const { title, cycle, departmentIds, description } = req.body;
      const userId = req.user.id;

      // 1. Create the report
      const report = await prisma.report.create({
        data: {
          title: title.trim(),
          cycle,
          description: description?.trim(),
          state: 'DRAFT',
          createdById: userId
        },
        select: {
          id: true,
          title: true,
          cycle: true,
          state: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 2. Get section templates based on selected departments or all if not specified
      const templateFilter = departmentIds?.length 
        ? { departmentId: { in: departmentIds } }
        : {};

      const templates = await prisma.sectionTemplate.findMany({
        where: templateFilter,
        select: {
          id: true,
          key: true,
          displayName: true,
          departmentId: true
        }
      });

      if (!templates.length) {
        throw new Error('No section templates found for the selected departments');
      }

      // 3. Create report sections for each template (inactive by default)
      const sections = await Promise.all(
        templates.map(template => 
          prisma.reportSection.create({
            data: {
              reportId: report.id,
              templateId: template.id,
              isActive: false,
              updatedById: userId
            },
            select: {
              id: true,
              isActive: true,
              template: {
                select: {
                  id: true,
                  key: true,
                  displayName: true,
                  department: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          })
        )
      );

      // 4. Prepare response with report and sections
      const response = {
        ...report,
        sections,
        sectionCount: sections.length
      };

      // 5. Report created successfully

      // 6. Return the created report with 201 status
      res.status(201).json(response);
      
      return response;
    } catch (error) {
      console.error('[Report Creation Error]', {
        error: error.message,
        stack: error.stack,
        user: req.user?.id,
        body: req.body
      });
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        throw new Error('A report with similar details already exists');
      }
      
      if (error.code === 'P2025') {
        throw new Error('One or more related records not found');
      }
      
      // Re-throw the error to be handled by the error middleware
      throw error;
    }
  }).catch(next);
};

/**
 * Create report from template (secretary role only)
 * 
 * @route POST /api/reports/from-template/:templateId
 * @requires authentication with secretary role
 * @param {string} req.params.templateId - Template ID
 * @param {object} req.body - Report data
 * @param {string} req.body.title - Report title
 * @param {string} req.body.cycle - Report cycle (WEEKLY/MONTHLY/ADHOC)
 * @param {Date} [req.body.dueAt] - Report due date
 * @param {string} [req.body.description] - Report description
 * @returns {object} Created report with sections
 */
const createReportFromTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const { title, cycle, dueAt, description } = req.body;

    // Validate required fields
    if (!title || !cycle) {
      return res.status(400).json({ 
        error: t('report.titleRequired', req.language) + ', ' + t('report.periodRequired', req.language) 
      });
    }

    // Get template with sections
    const template = await req.prisma.reportTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: t('report.templateNotFound', req.language) });
    }

    if (!template.isActive) {
      return res.status(400).json({ error: t('report.templateInactive', req.language) });
    }

    // Create report and sections in transaction
    const report = await req.prisma.$transaction(async (tx) => {
      // Create the report
      const newReport = await tx.report.create({
        data: {
          title,
          description,
          cycle,
          dueAt: dueAt ? new Date(dueAt) : null,
          templateId,
          createdById: req.user.id,
          state: 'DRAFT'
        }
      });

      // Create sections from template
      const sectionDueAt = dueAt ? new Date(new Date(dueAt).getTime() - 2 * 24 * 60 * 60 * 1000) : null; // 2 days before report due
      
      const sectionPromises = template.sections.map(templateSection => 
        tx.reportSection.create({
          data: {
            reportId: newReport.id,
            sectionName: templateSection.sectionName,
            instructions: templateSection.instructions,
            departmentId: templateSection.departmentId,
            displayOrder: templateSection.displayOrder,
            dueAt: sectionDueAt,
            isActive: true,
            state: 'DRAFT'
          }
        })
      );

      await Promise.all(sectionPromises);

      // Return the complete report
      return await tx.report.findUnique({
        where: { id: newReport.id },
        include: {
          template: true,
          sections: {
            include: {
              department: true
            },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report from template:', error.message);
    next(error);
  }
};

/**
 * Create custom report without template (secretary role only)
 * 
 * @route POST /api/reports/custom
 * @requires authentication with secretary role
 * @param {object} req.body - Report data
 * @param {string} req.body.title - Report title
 * @param {string} req.body.cycle - Report cycle (WEEKLY/MONTHLY/ADHOC)
 * @param {Date} [req.body.dueAt] - Report due date
 * @param {string} [req.body.description] - Report description
 * @param {Array} [req.body.sections] - Initial sections to create
 * @returns {object} Created report
 */
const createCustomReport = async (req, res, next) => {
  try {
    const { title, cycle, dueAt, description, sections = [] } = req.body;

    // Validate required fields
    if (!title || !cycle) {
      return res.status(400).json({ 
        error: t('report.titleRequired', req.language) + ', ' + t('report.periodRequired', req.language) 
      });
    }

    // Create report and optional initial sections in transaction
    const report = await req.prisma.$transaction(async (tx) => {
      // Create the report
      const newReport = await tx.report.create({
        data: {
          title,
          description,
          cycle,
          dueAt: dueAt ? new Date(dueAt) : null,
          createdById: req.user.id,
          state: 'DRAFT'
        }
      });

      // Create initial sections if provided
      if (sections.length > 0) {
        const sectionDueAt = dueAt ? new Date(new Date(dueAt).getTime() - 2 * 24 * 60 * 60 * 1000) : null;
        
        const sectionPromises = sections.map((section, index) => 
          tx.reportSection.create({
            data: {
              reportId: newReport.id,
              sectionName: section.sectionName,
              instructions: section.instructions,
              departmentId: section.departmentId,
              displayOrder: section.displayOrder ?? index,
              dueAt: sectionDueAt,
              isActive: true,
              state: 'DRAFT'
            }
          })
        );

        await Promise.all(sectionPromises);
      }

      // Return the complete report
      return await tx.report.findUnique({
        where: { id: newReport.id },
        include: {
          sections: {
            include: {
              department: true
            },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating custom report:', error.message);
    next(error);
  }
};

/**
 * Add section to existing report (secretary role only)
 * 
 * @route POST /api/reports/:id/sections
 * @requires authentication with secretary role
 * @param {string} req.params.id - Report ID
 * @param {object} req.body - Section data
 * @param {string} req.body.sectionName - Section name
 * @param {string} req.body.departmentId - Department ID
 * @param {string} [req.body.instructions] - Section instructions
 * @param {number} [req.body.displayOrder] - Display order
 * @returns {object} Created section
 */
const addSectionToReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sectionName, departmentId, instructions, displayOrder } = req.body;

    // Validate required fields
    if (!sectionName || !departmentId) {
      return res.status(400).json({ 
        error: t('section.titleRequired', req.language) + ', ' + t('department.nameRequired', req.language)
      });
    }

    // Check if report exists and is not finalized
    const report = await req.prisma.report.findUnique({
      where: { id, type: 'OFFICIAL' },
      include: {
        sections: {
          orderBy: { displayOrder: 'desc' },
          take: 1
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: t('report.notFound', req.language) });
    }

    if (report.state === 'FINAL') {
      return res.status(400).json({ error: t('report.cannotAddSections', req.language) });
    }

    // Determine display order
    const newDisplayOrder = displayOrder ?? (report.sections[0]?.displayOrder ?? 0) + 1;
    const sectionDueAt = report.dueAt ? new Date(report.dueAt.getTime() - 2 * 24 * 60 * 60 * 1000) : null;

    // Create the section
    const section = await req.prisma.reportSection.create({
      data: {
        reportId: id,
        sectionName,
        instructions,
        departmentId,
        displayOrder: newDisplayOrder,
        dueAt: sectionDueAt,
        isActive: true,
        state: 'DRAFT'
      },
      include: {
        department: true
      }
    });

    res.status(201).json(section);
  } catch (error) {
    console.error('Error adding section to report:', error.message);
    next(error);
  }
};

/**
 * Get report details by ID
 * 
 * @route GET /api/reports/:id
 * @requires authentication
 * @param {string} req.params.id - Report ID
 * @returns {object} Report details with sections
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, departmentId } = req.user;
    
    // Get report with sections
    const report = await req.prisma.report.findUnique({
      where: { id, isDeleted: false, type: 'OFFICIAL' },
      include: {
        sections: {
          include: {
            reportTemplateSection: {
              include: {
                department: true
              }
            },
            department: true,
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          // For department users, only include their department's sections
          ...(role === 'department' && {
            where: {
              departmentId
            }
          })
        }
      }
    });
    
    // Report not found
    if (!report) {
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }
    
    // For department users, check if they have access to this report
    if (role === 'department') {
      const hasAccess = report.sections.some(section => section.departmentId === departmentId);
      if (!hasAccess) {
        return res.status(403).json({ message: t('report.accessDenied', req.language) });
      }
    }
    
    res.json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * Update report details (secretary role only)
 * 
 * @route PUT /api/reports/:id
 * @requires authentication with secretary role
 * @param {string} req.params.id - Report ID
 * @param {object} req.body - Updated report data
 * @returns {object} Updated report
 */
const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, cycle, state, description, sections } = req.body;
    
    // Use transaction for atomic updates
    const result = await req.prisma.$transaction(async (tx) => {
      // Update report metadata fields that were provided
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (cycle !== undefined) updateData.cycle = cycle;
      if (state !== undefined) updateData.state = state;
      if (description !== undefined) updateData.description = description;
      
      // Update report metadata if any fields provided
      if (Object.keys(updateData).length > 0) {
        await tx.report.update({
          where: { id, type: 'OFFICIAL' },
          data: updateData
        });
      }
      
      // Update sections if provided
      if (sections && sections.length > 0) {
        // Elegant solution: Use a large offset to avoid conflicts, then normalize
        const maxOrder = Math.max(...sections.map(s => s.displayOrder));
        const offset = maxOrder + 1000; // Large enough to avoid conflicts
        
        // First pass: Move all sections to offset range (guaranteed no conflicts)
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          await tx.reportSection.update({
            where: { 
              id: section.id,
              reportId: id // Security: ensure section belongs to this report
            },
            data: {
              isActive: section.isActive,
              displayOrder: offset + i // Temporary offset value
            }
          });
        }
        
        // Second pass: Set final displayOrder values
        for (const section of sections) {
          await tx.reportSection.update({
            where: { 
              id: section.id,
              reportId: id
            },
            data: {
              displayOrder: section.displayOrder
            }
          });
        }
      }
      
      // Return updated report with sections
      return tx.report.findUnique({
        where: { id, type: 'OFFICIAL' },
        include: {
          sections: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });
    });
    
    res.json(result);
  } catch (error) {
    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }
    // Handle unique constraint violation (display order conflict)
    if (error.code === 'P2002') {
      return res.status(409).json({ message: t('section.invalidOrder', req.language) });
    }
    next(error);
  }
};

/**
 * Finalize a report (secretary role only)
 * 
 * @route PUT /api/reports/:id/finalize
 * @requires authentication with secretary role
 * @param {string} req.params.id - Report ID
 * @returns {object} Finalized report
 */
const finalizeReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if report exists and is in PUBLISHED state
    const existingReport = await req.prisma.report.findUnique({
      where: { id, type: 'OFFICIAL' },
      include: {
        sections: {
          where: { isActive: true },
          include: {
            reportTemplateSection: true,
            department: true
          }
        }
      }
    });

    if (!existingReport) {
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }

    if (existingReport.state !== 'PUBLISHED') {
      return res.status(400).json({ 
        message: t('report.cannotModifyPublished', req.language) 
      });
    }

    // Check if all active sections are submitted
    const unsubmittedSections = existingReport.sections.filter(
      section => section.state !== 'SUBMITTED'
    );

    if (unsubmittedSections.length > 0) {
      return res.status(400).json({ 
        message: t('report.submissionRequired', req.language),
        unsubmittedSections: unsubmittedSections.map(s => ({
          id: s.id,
          sectionName: s.sectionName
        }))
      });
    }

    // Update report state to FINAL and lock all sections
    const finalizedReport = await req.prisma.$transaction(async (prisma) => {
      // Update report state
      const report = await prisma.report.update({
        where: { id },
        data: { 
          state: 'FINAL',
          finalizedAt: new Date()
        }
      });

      // Lock all sections
      await prisma.reportSection.updateMany({
        where: { 
          reportId: id,
          isActive: true 
        },
        data: { locked: true }
      });

      return report;
    });

    // Fetch updated report with sections
    const fullReport = await req.prisma.report.findUnique({
      where: { id, type: 'OFFICIAL' },
      include: {
        sections: {
          include: {
            reportTemplateSection: {
              include: {
                department: true
              }
            },
            department: true,
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      }
    });

    res.json(fullReport);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a report (secretary role only)
 * 
 * @route DELETE /api/reports/:id
 * @requires authentication with secretary role
 * @param {string} req.params.id - Report ID
 * @returns {object} Success message
 */
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if report exists
    const existingReport = await req.prisma.report.findUnique({
      where: { id, type: 'OFFICIAL' },
      include: {
        sections: {
          select: { id: true }
        }
      }
    });

    if (!existingReport) {
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }

    // Soft delete the report
    await req.prisma.report.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.status(204).send(); // No content to send back
  } catch (error) {
    if (error.code === 'P2025') { // Prisma's 'Record to delete does not exist.'
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }
    next(error);
  }
};

/**
 * Update full report content (all sections) (secretary role only)
 * 
 * @route PUT /api/reports/:id/full-content
 * @requires authentication with secretary role
 * @param {string} req.params.id - Report ID
 * @param {Array<{id: string, contentMarkdown: string}>} req.body.sectionsData - Array of section data with new content
 * @returns {object} Updated report with sections
 */
const updateFullReportContentHandler = async (req, res, next) => {
  try {
    const { id: reportId } = req.params;
    const { sectionsData } = req.body;
    const userId = req.user.id;

    if (!reportId) {
      return res.status(400).json({ message: t('validation.requiredField', req.language) });
    }
    if (!sectionsData || !Array.isArray(sectionsData) || sectionsData.length === 0) {
      return res.status(400).json({ message: t('validation.requiredField', req.language) });
    }
    if (!userId) {
      // This should ideally be caught by authentication middleware
      return res.status(401).json({ message: t('auth.required', req.language) });
    }

    const updatedReport = await reportService.updateFullReportContent(
      req.prisma,
      reportId,
      sectionsData,
      userId
    );

    res.json(updatedReport);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not belong')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('locked') || error.message.includes('finalized')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Invalid arguments') || error.message.includes('Invalid section data')){
      return res.status(400).json({message: error.message});
    }
    console.error('Error in updateFullReportContentHandler:', error.message);
    next(error);
  }
};

/**
 * Get department progress for a specific report
 * 
 * @route GET /api/reports/:id/department-progress
 * @requires authentication
 * @param {string} req.params.id - Report ID
 * @returns {array} Array of department progress objects
 */
const getDepartmentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, departmentId } = req.user;

    // Get report with sections to ensure it exists
    const report = await req.prisma.report.findUnique({
      where: { id, isDeleted: false, type: 'OFFICIAL' },
      include: {
        sections: {
          where: { isActive: true },
          include: {
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ message: t('report.notFound', req.language) });
    }

    // For department users, check if they have access to this report
    if (role === 'department') {
      const hasAccess = report.sections.some(section => section.departmentId === departmentId);
      if (!hasAccess) {
        return res.status(403).json({ message: t('report.accessDenied', req.language) });
      }
    }

    // Group sections by department and calculate progress
    const departmentMap = new Map();

    report.sections.forEach(section => {
      const deptId = section.departmentId;
      const deptName = section.department?.name || 'Unknown Department';

      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          departmentId: deptId,
          departmentName: deptName,
          sections: [],
          completedSections: 0,
          totalSections: 0,
          overdueCount: 0,
          progressPercentage: 0,
          lastActivity: null,
          status: 'not-started'
        });
      }

      const dept = departmentMap.get(deptId);
      dept.sections.push(section);
      dept.totalSections += 1;

      // Count completed sections (SUBMITTED state)
      if (section.state === 'SUBMITTED') {
        dept.completedSections += 1;
      }

      // Count overdue sections
      if (section.dueAt && new Date() > new Date(section.dueAt) && section.state !== 'SUBMITTED') {
        dept.overdueCount += 1;
      }

      // Track last activity
      if (section.updatedAt) {
        const sectionDate = new Date(section.updatedAt);
        if (!dept.lastActivity || sectionDate > dept.lastActivity) {
          dept.lastActivity = sectionDate;
        }
      }
    });

    // Calculate progress percentages and statuses
    const departmentProgress = Array.from(departmentMap.values()).map(dept => {
      // Calculate progress percentage
      dept.progressPercentage = dept.totalSections > 0 
        ? Math.round((dept.completedSections / dept.totalSections) * 100)
        : 0;

      // Determine status
      if (dept.completedSections === dept.totalSections && dept.totalSections > 0) {
        dept.status = 'complete';
      } else if (dept.overdueCount > 0) {
        dept.status = 'overdue';
      } else if (dept.completedSections > 0) {
        dept.status = 'in-progress';
      } else {
        dept.status = 'not-started';
      }

      // Remove sections array from response (not needed for progress)
      delete dept.sections;

      return dept;
    });

    // Sort by department name for consistent ordering
    departmentProgress.sort((a, b) => a.departmentName.localeCompare(b.departmentName));

    res.json(departmentProgress);
  } catch (error) {
    console.error('Error in getDepartmentProgress:', error);
    next(error);
  }
};

module.exports = {
  getReports,
  createReport,
  createReportFromTemplate,
  createCustomReport,
  addSectionToReport,
  getReportById,
  updateReport,
  finalizeReport,
  deleteReport,
  updateFullReportContentHandler,
  getDepartmentProgress
};