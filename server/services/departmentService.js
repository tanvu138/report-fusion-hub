const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateSecurePassword } = require('../utils/passwordUtils');
const prisma = new PrismaClient();

/**
 * Creates a new department and an associated user.
 * @param {string} name - The name of the department.
 * @param {string} [username] - Optional username for the department user.
 * @param {string} [initialPassword] - Optional initial password for the department user.
 * @param {string} [emailOpt] - Optional email for the department user.
 * @returns {Promise<Object>} The created department and the initial password for the user.
 * @throws {Error} If department name, username, or email already exists, or on other errors.
 */
async function createDepartment(name, username, initialPassword, emailOpt) {
  // Process department creation request
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Department name is required and must be a non-empty string.');
  }

  const existingDepartment = await prisma.department.findUnique({
    where: { name },
  });

  if (existingDepartment) {
    throw new Error(`Department with name "${name}" already exists.`);
  }

  let userToCreate = null;
  let finalInitialPassword = initialPassword;

  if (username) {
    if (typeof username !== 'string' || username.trim() === '') {
      throw new Error('Username must be a non-empty string if provided.');
    }
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new Error(`User with username "${username}" already exists.`);
    }

    let finalEmail = emailOpt; // Use the provided optional email
    if (finalEmail && (typeof finalEmail !== 'string' || finalEmail.trim() === '')) {
        finalEmail = null; // Treat empty string email as null or invalid
    }

    if (finalEmail) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: finalEmail },
      });
      if (existingUserByEmail) {
        throw new Error(`User with email "${finalEmail}" already exists.`);
      }
    }
    // Processing user creation
    if (!finalInitialPassword) {
      finalInitialPassword = generateSecurePassword();
    }
    // Hash the initial password
    const hashedPassword = await bcrypt.hash(finalInitialPassword, 10);
    // Password hashed successfully

    userToCreate = {
      username: username,
      name: `${username} (User)`, // Or a more descriptive name like `${name} Department User - ${username}`
      email: finalEmail, // This can be null if not provided or invalid
      password: hashedPassword,
      role: 'department',
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newDepartment = await tx.department.create({
        data: {
          name,
        },
      });

      let newUser = null;
      if (userToCreate) {
        newUser = await tx.user.create({
          data: {
            ...userToCreate,
            departmentId: newDepartment.id,
          },
        });
      }
      
      // Exclude password from the returned newUser object
      if (newUser) {
        const { password, ...userWithoutPassword } = newUser;
        // Return initial password to client
        return { department: newDepartment, newUser: userWithoutPassword, initialPassword: finalInitialPassword };
      }
      // No user created
      return { department: newDepartment, newUser: null, initialPassword: null };
    });
    return result;
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error creating department and user:', error);
    // Throw a more generic error or re-throw specific Prisma errors if needed
    if (error.code === 'P2002' && error.meta?.target?.includes('name') && Array.isArray(error.meta.target) && error.meta.target.join('').toLowerCase().includes('department')) { // Check if it's department name constraint
        throw new Error(`Department with name "${name}" already exists.`);
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        throw new Error(`User with username "${username}" already exists.`);
    }
    // Check for finalEmail existence before using it in error message for email constraint
    const userEmailForError = userToCreate && userToCreate.email ? userToCreate.email : (emailOpt || 'provided email');
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error(`User with email "${userEmailForError}" already exists.`);
    }
    throw new Error('Failed to create department and/or user. Possible duplicate entry or other database error.');
  }
}

/**
 * Retrieves all departments.
 * @returns {Promise<Array<Object>>} A list of all departments.
 */
async function getAllDepartments() {
  try {
    return await prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error('Error fetching all departments:', error);
    throw new Error('Failed to retrieve departments.');
  }
}

/**
 * Retrieves a department by its ID.
 * @param {string} departmentId - The ID of the department.
 * @returns {Promise<Object|null>} The department object or null if not found.
 */
async function getDepartmentById(departmentId) {
  if (!departmentId) {
    throw new Error('Department ID is required.');
  }
  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return null; // Or throw new Error('Department not found.'); depending on desired behavior
    }
    return department;
  } catch (error) {
    console.error(`Error fetching department with ID ${departmentId}:`, error);
    throw new Error('Failed to retrieve department.');
  }
}

/**
 * Updates a department's name.
 * @param {string} departmentId - The ID of the department to update.
 * @param {string} name - The new name for the department.
 * @returns {Promise<Object>} The updated department object.
 * @throws {Error} If department not found, name is invalid, or name already exists.
 */
async function updateDepartment(departmentId, name) {
  if (!departmentId) {
    throw new Error('Department ID is required for update.');
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('New department name is required and must be a non-empty string.');
  }

  try {
    // Check if a department with the new name already exists (and it's not the current one)
    const existingDepartmentWithName = await prisma.department.findFirst({
      where: {
        name: name,
        id: { not: departmentId },
      },
    });

    if (existingDepartmentWithName) {
      throw new Error(`Another department with name "${name}" already exists.`);
    }

    return await prisma.department.update({
      where: { id: departmentId },
      data: { name },
    });
  } catch (error) {
    console.error(`Error updating department with ID ${departmentId}:`, error);
    if (error.code === 'P2025') { // Prisma's code for record not found on update
      throw new Error(`Department with ID "${departmentId}" not found.`);
    }
    if (error.message.includes('already exists')) { // Re-throw custom unique constraint error
        throw error;
    }
    throw new Error('Failed to update department.');
  }
}

/**
 * Deletes a department by its ID.
 * Checks for associated users or report template sections before deletion.
 * @param {string} departmentId - The ID of the department to delete.
 * @returns {Promise<Object>} The deleted department object.
 * @throws {Error} If department not found or if it has dependencies.
 */
async function deleteDepartment(departmentId) {
  if (!departmentId) {
    throw new Error('Department ID is required for deletion.');
  }

  try {
    // Disassociate users from the department
    await prisma.user.updateMany({
      where: { departmentId: departmentId },
      data: { departmentId: null },
    });

    // Check for associated report template sections
    const templateSections = await prisma.reportTemplateSection.count({
        where: { departmentId: departmentId },
    });

    if (templateSections > 0) {
        throw new Error(`Cannot delete department. It is used in ${templateSections} report template section(s).`);
    }
    
    // Check for associated report sections (direct assignment)
    const reportSections = await prisma.reportSection.count({
        where: { departmentId: departmentId },
    });

    if (reportSections > 0) {
        throw new Error(`Cannot delete department. It is assigned to ${reportSections} active report section(s).`);
    }

    return await prisma.department.delete({
      where: { id: departmentId },
    });
  } catch (error) {
    console.error(`Error deleting department with ID ${departmentId}:`, error);
    if (error.code === 'P2025') { // Prisma's code for record not found on delete
      throw new Error(`Department with ID "${departmentId}" not found.`);
    }
    if (error.message.startsWith('Cannot delete department.')) { // Re-throw custom dependency error
        throw error;
    }
    throw new Error('Failed to delete department.');
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
