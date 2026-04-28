const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateSecurePassword } = require('../utils/passwordUtils');
const { t } = require('../utils/i18n');
const prisma = new PrismaClient();

/**
 * Creates a new user.
 * @param {object} userData - User data.
 * @param {string} userData.username - The username (required).
 * @param {string} userData.name - The display name (required).
 * @param {string} [userData.email] - The email (optional).
 * @param {string} [userData.password] - The password (optional, will be generated if not provided).
 * @param {UserRole} userData.role - The user role (required, e.g., 'secretary', 'department').
 * @param {string} [userData.departmentId] - The ID of the department to associate the user with (optional).
 * @returns {Promise<{user: object, initialPassword?: string}>} The created user object (password excluded) and initial password if generated.
 * @throws {Error} If validation fails or user already exists.
 */
async function createUser({ username, name, email, password, role, departmentId }, language = 'en') {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    throw new Error(t('user.usernameRequired', language));
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error(t('user.nameRequired', language));
  }
  if (!role || !Object.values(UserRole).includes(role)) {
    throw new Error(t('user.invalidRole', language));
  }
  // Ensure department users are linked to a department
  if (role === UserRole.department && !departmentId) {
    throw new Error(t('user.departmentRequired', language));
  }
  if (departmentId && (typeof departmentId !== 'string' || departmentId.trim() === '')) {
    throw new Error('Department ID must be a non-empty string if provided.');
  }
  if (email && (typeof email !== 'string' || email.trim() === '')) {
    // Allow null or valid email, but not empty string
    email = null;
  }

  const existingUserByUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUserByUsername) {
    throw new Error(t('user.usernameExists', language));
  }

  if (email) {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new Error(`User with email "${email}" already exists.`);
    }
  }

  let initialPassword = password;
  if (!initialPassword) {
    initialPassword = generateSecurePassword();
  }
  const hashedPassword = await bcrypt.hash(initialPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      name,
      email,
      password: hashedPassword,
      role,
      departmentId: departmentId || null,
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, initialPassword: password ? undefined : initialPassword };
}

/**
 * Retrieves a paginated list of users with filtering and sorting.
 * @param {object} options - Options for querying users.
 * @param {number} [options.page=1] - The page number for pagination.
 * @param {number} [options.limit=10] - The number of users per page.
 * @param {string} [options.sortBy='createdAt'] - The field to sort by.
 * @param {'asc'|'desc'} [options.sortOrder='desc'] - The sort order.
 * @param {string} [options.search=''] - A search term to filter by username, name, or email.
 * @param {UserRole} [options.role] - Filter by a specific user role.
 * @param {string} [options.departmentId] - Filter by a specific department ID.
 * @returns {Promise<{users: object[], total: number, page: number, limit: number}>} Paginated list of users and total count.
 */
async function getUsers({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '', role, departmentId }) {
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role && Object.values(UserRole).includes(role)) {
    where.role = role;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: { // Explicitly select fields to exclude password
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      department: {
        select: {
          id: true,
          name: true,
        }
      }
    },
  });

  const totalUsers = await prisma.user.count({
    where,
  });

  return {
    users,
    total: totalUsers,
    page,
    limit,
  };
}

async function getUserById(userId, language = 'en') {
  if (!userId) {
    throw new Error(t('validation.requiredField', language));
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      department: {
        select: {
          id: true,
          name: true,
        }
      }
    },
  });
  return user;
}

async function updateUser(userId, userData, language = 'en') {
  if (!userId) {
    throw new Error(t('validation.requiredField', language));
  }

  const { name, email, role, departmentId, password } = userData;

  // Fetch existing user to validate against and prevent username change
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new Error(t('user.notFound', language));
  }

  // Prevent username changes
  if (userData.username && userData.username !== existingUser.username) {
    throw new Error('Username cannot be changed.');
  }

  const dataToUpdate = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error(t('user.nameRequired', language));
    }
    dataToUpdate.name = name.trim();
  }

  if (email !== undefined) {
    if (email === null || (typeof email === 'string' && email.trim() === '')) {
      dataToUpdate.email = null;
    } else if (typeof email === 'string') {
      const trimmedEmail = email.trim();
      if (trimmedEmail !== existingUser.email) {
        const userWithSameEmail = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (userWithSameEmail && userWithSameEmail.id !== userId) {
          throw new Error(`Email "${trimmedEmail}" is already in use by another user.`);
        }
      }
      dataToUpdate.email = trimmedEmail;
    } else {
      throw new Error('Email must be a string or null.');
    }
  }

  if (role !== undefined) {
    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`Role must be one of: ${Object.values(UserRole).join(', ')}.`);
    }
    dataToUpdate.role = role;
  }

  if (departmentId !== undefined) {
    if (departmentId === null) {
      dataToUpdate.departmentId = null;
    } else if (typeof departmentId === 'string') {
      const trimmedDeptId = departmentId.trim();
      if (trimmedDeptId === '') {
        dataToUpdate.departmentId = null; // Treat empty string as null
      } else {
        dataToUpdate.departmentId = trimmedDeptId;
      }
    } else {
      // This case implies departmentId is not a string and not null, which is invalid.
      throw new Error('Department ID must be a string or null.');
    }
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length === 0) {
      // Allow clearing password by sending empty string? Or require a new password?
      // For now, let's assume an empty string means no change to password, or a new password must be valid.
      // If password is provided, it must not be an empty string if it's meant to be updated.
      // This logic might need refinement based on exact requirements for password updates.
    } else {
        if (password.length < 6) { // Example: minimum password length
            throw new Error(t('user.passwordTooShort', language));
        }
        dataToUpdate.password = await bcrypt.hash(password, 10);
    }
  }
  
  if (Object.keys(dataToUpdate).length === 0) {
    // No actual data to update, return the existing user (excluding password)
    const { password: _, ...userWithoutPassword } = existingUser;
    return userWithoutPassword;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      department: {
        select: {
          id: true,
          name: true,
        }
      }
    },
  });

  return updatedUser;
}

async function deleteUser(userId, language = 'en') {
  if (!userId) {
    throw new Error(t('validation.requiredField', language));
  }
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    return true;
  } catch (error) {
    // Prisma throws P2025 if record to delete does not exist.
    if (error.code === 'P2025') {
      return false; // User not found
    }
    console.error('Error deleting user:', error.message);
    throw error; // Re-throw other errors
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
