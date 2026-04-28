const crypto = require('crypto');

/**
 * Generates a random numeric/alphanumeric challenge code.
 * Default length = 6 digits (like Google share codes).
 * @param {number} length
 * @param {boolean} alphanumeric - If true, use 0-9A-Z; otherwise 0-9.
 * @returns {string}
 */
function generateChallengeCode(length = 6, alphanumeric = false) {
  const charset = alphanumeric ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' : '0123456789';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += charset[bytes[i] % charset.length];
  }
  return code;
}

module.exports = {
  generateChallengeCode,
};
