/**
 * Generates a random secure password.
 * @returns {string} A random password.
 */
function generateSecurePassword() {
  // Simple password generator, consider a more robust one for production
  return Math.random().toString(36).slice(-10) + 'A1!';
}

module.exports = {
  generateSecurePassword,
};
