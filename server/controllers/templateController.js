const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { t } = require('../utils/i18n');

class TemplateController {
  // List all active templates (secretary only)
  async listTemplates(req, res) {
    try {
      if (req.user.role !== 'secretary') {
        return res.status(403).json({ error: t('auth.insufficientPermissions', req.language) });
      }

      const templates = await prisma.reportTemplate.findMany({
        where: { isActive: true },
        include: {
          sections: {
            include: {
              department: true
            },
            orderBy: { displayOrder: 'asc' }
          },
          createdBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(templates);
    } catch (error) {
      console.error('Error listing templates:', error.message);
      res.status(500).json({ error: 'Failed to list templates' });
    }
  }

  // Get a single template by ID
  async getTemplate(req, res) {
    try {
      if (req.user.role !== 'secretary') {
        return res.status(403).json({ error: t('auth.insufficientPermissions', req.language) });
      }

      const { id } = req.params;
      const template = await prisma.reportTemplate.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              department: true
            },
            orderBy: { displayOrder: 'asc' }
          },
          createdBy: {
            select: { name: true, email: true }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error getting template:', error.message);
      res.status(500).json({ error: 'Failed to get template' });
    }
  }

  // Create a new template with sections
  async createTemplate(req, res) {
    try {
      if (req.user.role !== 'secretary') {
        return res.status(403).json({ error: 'Only secretaries can create templates' });
      }

      const { name, description, sections } = req.body;

      // Validate input
      if (!name || !sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({ 
          error: 'Template name and at least one section are required' 
        });
      }

      // Validate sections
      for (const section of sections) {
        if (!section.sectionName || !section.departmentId) {
          return res.status(400).json({ 
            error: 'Each section must have a name and department' 
          });
        }
      }

      // Create template with sections in a transaction
      const template = await prisma.$transaction(async (tx) => {
        // Create the template
        const newTemplate = await tx.reportTemplate.create({
          data: {
            name,
            description,
            createdById: req.user.id,
            isActive: true
          }
        });

        // Create sections
        const sectionPromises = sections.map((section, index) => 
          tx.reportTemplateSection.create({
            data: {
              templateId: newTemplate.id,
              sectionName: section.sectionName,
              instructions: section.instructions,
              departmentId: section.departmentId,
              displayOrder: section.displayOrder ?? index
            }
          })
        );

        await Promise.all(sectionPromises);

        // Return the complete template
        return await tx.reportTemplate.findUnique({
          where: { id: newTemplate.id },
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

      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error.message);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  // Update an existing template
  async updateTemplate(req, res) {
    try {
      if (req.user.role !== 'secretary') {
        return res.status(403).json({ error: 'Only secretaries can update templates' });
      }

      const { id } = req.params;
      const { name, description, sections } = req.body;

      // Check if template exists
      const existingTemplate = await prisma.reportTemplate.findUnique({
        where: { id }
      });

      if (!existingTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Update template and sections in a transaction
      const updatedTemplate = await prisma.$transaction(async (tx) => {
        // Update template basic info
        await tx.reportTemplate.update({
          where: { id },
          data: {
            name: name ?? existingTemplate.name,
            description: description ?? existingTemplate.description
          }
        });

        // If sections are provided, update them
        if (sections && Array.isArray(sections)) {
          // Delete existing sections
          await tx.reportTemplateSection.deleteMany({
            where: { templateId: id }
          });

          // Create new sections
          const sectionPromises = sections.map((section, index) => 
            tx.reportTemplateSection.create({
              data: {
                templateId: id,
                sectionName: section.sectionName,
                instructions: section.instructions,
                departmentId: section.departmentId,
                displayOrder: section.displayOrder ?? index
              }
            })
          );

          await Promise.all(sectionPromises);
        }

        // Return the updated template
        return await tx.reportTemplate.findUnique({
          where: { id },
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

      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating template:', error.message);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }

  // Deactivate a template (soft delete)
  async deleteTemplate(req, res) {
    try {
      if (req.user.role !== 'secretary') {
        return res.status(403).json({ error: 'Only secretaries can delete templates' });
      }

      const { id } = req.params;

      // Check if template exists
      const template = await prisma.reportTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Soft delete by setting isActive to false
      await prisma.reportTemplate.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({ message: t('template.updateSuccessful', req.language) });
    } catch (error) {
      console.error('Error deleting template:', error.message);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }

  // Preview template structure
  async previewTemplate(req, res) {
    try {
      if (req.user.role !== 'secretary') {
        return res.status(403).json({ error: 'Only secretaries can preview templates' });
      }

      const { id } = req.params;
      const template = await prisma.reportTemplate.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              department: {
                select: { name: true }
              }
            },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Format for preview
      const preview = {
        templateName: template.name,
        description: template.description,
        sections: template.sections.map(section => ({
          sectionName: section.sectionName,
          department: section.department.name,
          instructions: section.instructions,
          order: section.displayOrder
        }))
      };

      res.json(preview);
    } catch (error) {
      console.error('Error previewing template:', error.message);
      res.status(500).json({ error: 'Failed to preview template' });
    }
  }
}

module.exports = new TemplateController();
