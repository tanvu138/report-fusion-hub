/**
 * Request Validation Middleware
 * 
 * This module provides middleware functions to validate request data
 * before it reaches controller methods. It uses the zod library for
 * schema validation and provides consistent error handling.
 * 
 * Usage:
 * - Import this middleware and the appropriate schema
 * - Add to route: router.post('/route', validateRequest(schema), controller)
 */

const { z } = require('zod');

/**
 * Creates a middleware that validates request data against a schema
 * 
 * @param {Object} schema - Object containing zod schemas for different parts of the request
 * @param {z.ZodSchema} [schema.body] - Schema for request body
 * @param {z.ZodSchema} [schema.query] - Schema for query parameters
 * @param {z.ZodSchema} [schema.params] - Schema for route parameters
 */
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Initialize validation results
      const validated = {};
      
      // Validate request body if schema provided
      if (schema.body) {
        validated.body = await schema.body.parseAsync(req.body);
      }
      
      // Validate query parameters if schema provided
      if (schema.query) {
        validated.query = await schema.query.parseAsync(req.query);
      }
      
      // Validate route parameters if schema provided
      if (schema.params) {
        validated.params = await schema.params.parseAsync(req.params);
      }
      
      // Replace request properties with validated data
      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      if (validated.params) req.params = validated.params;
      
      // Continue to controller
      next();
    } catch (error) {
      // Format zod error messages
      if (error instanceof z.ZodError) {
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.status = 400;
        validationError.details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        console.error('Validation Error Details:', JSON.stringify(validationError.details, null, 2), 'Body:', req.body);
        require('fs').appendFileSync('validation-error.log', new Date().toISOString() + '\\n' + JSON.stringify(validationError.details) + '\\nBody: ' + JSON.stringify(req.body) + '\\n\\n');
        
        next(validationError);
      } else {
        // Forward other errors to error handler
        next(error);
      }
    }
  };
};

// Common validation schemas
const schemas = {
  // Login request schema
  login: {
    body: z.object({
      username: z.string().min(1, 'Username is required').max(50, 'Username cannot exceed 50 characters'),
      password: z.string().min(6, 'Password must be at least 6 characters')
    })
  },
  
  // Report creation schema
  createReport: {
    body: z.object({
      title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters')
        .trim(),
      cycle: z.enum(['WEEKLY', 'MONTHLY', 'ADHOC'], 'Invalid report cycle'),
      departmentIds: z.array(z.string().min(1, 'Invalid department ID'))
        .min(1, 'At least one department is required')
        .optional(),
      description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional()
    }),
    query: z.object({
      // Add any query params if needed
    }).optional()
  },
  
  // Report update schema
  updateReport: {
    body: z.object({
      title: z.string().min(1, 'Title is required').optional(),
      cycle: z.enum(['WEEKLY', 'MONTHLY', 'ADHOC'], 'Invalid report cycle').optional(),
      state: z.enum(['DRAFT', 'PUBLISHED'], 'Invalid report state').optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
      sections: z.array(z.object({
        id: z.string().min(1, 'Section ID is required'),
        isActive: z.boolean(),
        displayOrder: z.number().int().min(1, 'Display order must be a positive integer')
      })).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided'
    }),
    params: z.object({
      id: z.string().min(1, 'Invalid report ID')
    })
  },
  
  // Section update schema
  updateSection: {
    body: z.object({
      contentMarkdown: z.string().optional()
    }),
    params: z.object({
      id: z.string().min(1, 'Invalid report ID'),
      sectionId: z.string().min(1, 'Invalid section ID')
    })
  },
  
  // Section activation schema
  toggleSection: {
    body: z.object({
      isActive: z.boolean()
    }),
    params: z.object({
      id: z.string().min(1, 'Invalid report ID'),
      sectionId: z.string().min(1, 'Invalid section ID')
    })
  },
  
  // Pagination schema for report list
  createCustomReport: {
    body: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').trim(),
      cycle: z.enum(['WEEKLY', 'MONTHLY', 'ADHOC'], { message: 'Invalid report cycle' }),
      dueAt: z.coerce.date({ message: 'Invalid due date' }).optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
      sections: z.array(z.object({
        sectionName: z.string().min(1, 'Section name is required').max(200, 'Section name cannot exceed 200 characters').trim(),
        departmentId: z.string().min(1, 'Invalid department ID'),
        instructions: z.string().max(2000, 'Instructions cannot exceed 2000 characters').optional(),
        displayOrder: z.number().int().min(0, { message: 'Display order must be at least 0' }).optional(),
      })).optional(),
    })
  },

  createReportFromTemplate: {
    params: z.object({
      templateId: z.string().min(1, { message: 'Template ID is required' }), // Changed from uuid() to support CUIDs
    }),
    body: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').trim(),
      cycle: z.enum(['WEEKLY', 'MONTHLY', 'ADHOC'], { message: 'Invalid report cycle' }),
      dueAt: z.coerce.date({ message: 'Invalid due date' }).optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    })
  },

  addSectionToReport: {
    params: z.object({
      id: z.string().min(1, 'Invalid report ID'), // Report ID
    }),
    body: z.object({
      sectionName: z.string().min(1, 'Section name is required').max(200, 'Section name cannot exceed 200 characters').trim(),
      departmentId: z.string().min(1, 'Invalid department ID'),
      instructions: z.string().max(2000, 'Instructions cannot exceed 2000 characters').optional(),
      displayOrder: z.number().int().min(0, { message: 'Display order must be at least 0' }).optional(),
    })
  },
  
  pagination: {
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      state: z.enum(['DRAFT', 'PUBLISHED']).optional(),
      cycle: z.enum(['WEEKLY', 'MONTHLY', 'ADHOC']).optional(),
    })
  },

  // Schema for updating full report content (multiple sections)
  updateFullReportContent: {
    params: z.object({
      id: z.string().min(1, 'Invalid report ID'), // Report ID
    }),
    body: z.object({
      sectionsData: z.array(
        z.object({
          id: z.string().min(1, 'Invalid section ID'), // Section ID
          contentMarkdown: z.string({ // contentMarkdown can be an empty string
            required_error: 'contentMarkdown is required for each section',
            invalid_type_error: 'contentMarkdown must be a string',
          }),
        })
      ).min(1, 'sectionsData array cannot be empty and must contain at least one section update.'),
    }),
  },

  // User management schemas
  createUser: {
    body: z.object({
      username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username cannot exceed 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
      name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
      email: z.string().email('Invalid email address').optional(),
      role: z.enum(['secretary', 'department'], 'Invalid role'),
      departmentId: z.string().min(1, 'Department ID is required').optional(),
      password: z.string().min(6, 'Password must be at least 6 characters').optional()
    }).refine(data => {
      if (data.role === 'department' && !data.departmentId) {
        return false;
      }
      return true;
    }, {
      message: 'Department users must have a departmentId',
      path: ['departmentId']
    })
  },

  updateUser: {
    params: z.object({
      userId: z.string().min(1, 'Invalid user ID')
    }),
    body: z.object({
      username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      role: z.enum(['secretary', 'department']).optional(),
      departmentId: z.string().min(1).optional(),
      password: z.string().min(6).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided'
    })
  },

  getUserById: {
    params: z.object({
      userId: z.string().min(1, 'Invalid user ID')
    })
  },

  deleteUser: {
    params: z.object({
      userId: z.string().min(1, 'Invalid user ID')
    })
  },

  // Department management schemas
  createDepartment: {
    body: z.object({
      name: z.string().min(1, 'Department name is required').max(100, 'Name cannot exceed 100 characters'),
      username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username cannot exceed 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
      initialPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
      emailOpt: z.string().email('Invalid email address').optional()
    })
  },

  updateDepartment: {
    params: z.object({
      departmentId: z.string().min(1, 'Invalid department ID')
    }),
    body: z.object({
      name: z.string().min(1).max(100).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided'
    })
  },

  getDepartmentById: {
    params: z.object({
      departmentId: z.string().min(1, 'Invalid department ID')
    })
  },

  deleteDepartment: {
    params: z.object({
      departmentId: z.string().min(1, 'Invalid department ID')
    })
  },

  // Workspace schemas
  createWorkspaceReport: {
    body: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').trim(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    })
  },
  updateWorkspaceReport: {
    body: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').trim().optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    }).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' })
  },
  updateWorkspaceContent: {
    body: z.object({
      contentMarkdown: z.string().max(500000, 'Content too large'),
    })
  },

  // File upload schema
  uploadFile: {
    body: z.object({
      reportId: z.string().min(1, 'Report ID is required')
    })
  }
};

module.exports = {
  validateRequest,
  schemas
};
