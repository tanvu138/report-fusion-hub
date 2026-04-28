const express = require('express');
const router = express.Router();
const { DepartmentControllerInstance, createDepartmentHandler, getDepartmentByIdHandler, updateDepartmentHandler, deleteDepartmentHandler, listDepartmentsHandler } = require('../controllers/departmentController');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// All department routes require authentication
// router.use(authenticate); // Authentication is now applied per-route for clarity with role authorization

// --- Department Management CRUD (for Secretaries) ---
router.post('/', authenticate, authorizeRole('secretary'), validateRequest(schemas.createDepartment), createDepartmentHandler);
router.get('/', authenticate, authorizeRole('secretary'), listDepartmentsHandler); // Changed to use the specific handler for clarity
router.get('/:departmentId', authenticate, authorizeRole('secretary'), validateRequest(schemas.getDepartmentById), getDepartmentByIdHandler);
router.put('/:departmentId', authenticate, authorizeRole('secretary'), validateRequest(schemas.updateDepartment), updateDepartmentHandler);
router.delete('/:departmentId', authenticate, authorizeRole('secretary'), validateRequest(schemas.deleteDepartment), deleteDepartmentHandler);

// --- Department-Specific Views (for Department Users) ---
// These routes use the DepartmentControllerInstance as they are class methods
router.get('/my-sections', authenticate, DepartmentControllerInstance.getMySections);

router.get('/my-sections/pending', authenticate, DepartmentControllerInstance.getMyPendingSections);
router.get('/sections/:sectionId', authenticate, DepartmentControllerInstance.getSection);
router.put('/sections/:sectionId/content', authenticate, DepartmentControllerInstance.updateSectionContent);
router.post('/sections/:sectionId/submit', authenticate, DepartmentControllerInstance.submitSection);

module.exports = router;
