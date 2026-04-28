const express = require('express');
const router = express.Router();
const { createUserController, getUsersController, getUserByIdController, updateUserController, deleteUserController } = require('../controllers/userController');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// --- User Management CRUD (for Secretaries) ---

// Create a new user
router.post('/', authenticate, authorizeRole('secretary'), validateRequest(schemas.createUser), createUserController);

// Get a list of users (with pagination, filtering, sorting)
router.get('/', authenticate, authorizeRole('secretary'), getUsersController);

// Future routes for user management (update, delete, getById) can be added here
router.get('/:userId', authenticate, authorizeRole('secretary'), validateRequest(schemas.getUserById), getUserByIdController);
router.put('/:userId', authenticate, authorizeRole('secretary'), validateRequest(schemas.updateUser), updateUserController);
router.delete('/:userId', authenticate, authorizeRole('secretary'), validateRequest(schemas.deleteUser), deleteUserController);

module.exports = router;
