/**
 * Workspace Controller
 *
 * Handles personal workspace note operations.
 * All users (secretary + department) can create/manage private notes.
 * Notes are single-document: 1 Report + 1 auto-created ReportSection.
 */
const { t } = require('../utils/i18n');

const listReports = async (req, res, next) => {
  try {
    const reports = await req.prisma.report.findMany({
      where: {
        type: 'PERSONAL',
        createdById: req.user.id,
        isDeleted: false,
      },
      include: {
        sections: { where: { isActive: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const report = await req.prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          type: 'PERSONAL',
          cycle: 'ADHOC',
          state: 'DRAFT',
          createdById: req.user.id,
        },
      });
      await tx.reportSection.create({
        data: {
          reportId: newReport.id,
          sectionName: title.trim(),
          departmentId: req.user.departmentId || null,
          displayOrder: 0,
          state: 'DRAFT',
          isActive: true,
        },
      });
      return tx.report.findUnique({
        where: { id: newReport.id },
        include: { sections: { where: { isActive: true } } },
      });
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    // authorizeWorkspaceOwner already validated ownership; fetch with sections
    const report = await req.prisma.report.findUnique({
      where: { id: req.workspaceReport.id },
      include: { sections: { where: { isActive: true } } },
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description.trim() || null;

    const report = await req.prisma.report.update({
      where: { id: req.workspaceReport.id },
      data,
      include: { sections: { where: { isActive: true } } },
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const updateContent = async (req, res, next) => {
  try {
    const { contentMarkdown } = req.body;

    const result = await req.prisma.reportSection.updateMany({
      where: { reportId: req.workspaceReport.id, isActive: true },
      data: { contentMarkdown, updatedById: req.user.id },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: t('workspace.sectionNotFound', req.language) });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    await req.prisma.report.update({
      where: { id: req.workspaceReport.id },
      data: { isDeleted: true },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReports,
  createReport,
  getReport,
  updateReport,
  updateContent,
  deleteReport,
};
