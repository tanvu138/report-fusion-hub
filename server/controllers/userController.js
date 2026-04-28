const userService = require('../services/userService');
const { t } = require('../utils/i18n');

/**
 * Handles the creation of a new user.
 */
async function createUserController(req, res) {
  try {
    const { username, name, email, password, role, departmentId } = req.body;
    const result = await userService.createUser({ username, name, email, password, role, departmentId }, req.language);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createUserController:', error.message);
    if (error.message.includes('already exists') || error.message.includes('is required') || error.message.includes('must be one of')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: t('user.createFailed', req.language) });
    }
  }
}

/**
 * Handles fetching a list of users with pagination, sorting, and filtering.
 */
async function getUsersController(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      search = '', 
      role, 
      departmentId 
    } = req.query;

    const usersData = await userService.getUsers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sortBy,
      sortOrder,
      search,
      role,
      departmentId,
    });

    res.status(200).json(usersData);
  } catch (error) {
    console.error('Error in getUsersController:', error.message);
    res.status(500).json({ error: t('general.serverError', req.language) });
  }
}

async function getUserByIdController(req, res) {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId, req.language);
    if (!user) {
      return res.status(404).json({ error: t('user.notFound', req.language) });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserByIdController:', error.message);
    res.status(500).json({ error: t('general.serverError', req.language) });
  }
}

async function updateUserController(req, res) {
  try {
    const { userId } = req.params;
    const userData = req.body;
    const updatedUser = await userService.updateUser(userId, userData, req.language);
    if (!updatedUser) {
      return res.status(404).json({ error: t('user.notFound', req.language) });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in updateUserController:', error.message);
    if (error.message.includes('not found') || error.message.includes('is required') || error.message.includes('must be one of')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: t('user.updateFailed', req.language) });
    }
  }
}

async function deleteUserController(req, res) {
  try {
    const { userId } = req.params;
    const deleted = await userService.deleteUser(userId, req.language);
    if (!deleted) {
      return res.status(404).json({ error: t('user.notFound', req.language) });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteUserController:', error.message);
    res.status(500).json({ error: t('user.deleteFailed', req.language) });
  }
}

module.exports = {
  createUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
};
