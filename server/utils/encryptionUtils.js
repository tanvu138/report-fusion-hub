const crypto = require('crypto');

// Required environment variable: FILE_ENCRYPTION_KEY
// Must be a base64‐encoded 32-byte key (256-bit) for AES-256-GCM.
const keyBase64 = process.env.FILE_ENCRYPTION_KEY;

if (!keyBase64) {
  throw new Error('Environment variable FILE_ENCRYPTION_KEY is required for file encryption but was not provided. ' +
    'Generate one with `openssl rand -base64 32` and add it to server/.env');
}

const KEY_BUFFER = Buffer.from(keyBase64, 'base64');
if (KEY_BUFFER.length !== 32) {
  throw new Error('FILE_ENCRYPTION_KEY must decode to 32 bytes (256-bit)');
}

const IV_LENGTH = 12; // Recommended length for GCM
const TAG_LENGTH = 16; // Auth tag length emitted by Node crypto for GCM

/**
 * Encrypt a buffer with AES-256-GCM.
 * Format of returned buffer: [IV][AuthTag][Ciphertext]
 * @param {Buffer} plainBuffer
 * @returns {Buffer}
 */
function encryptBuffer(plainBuffer) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt a buffer produced by encryptBuffer()
 * @param {Buffer} encryptedBuffer
 * @returns {Buffer}
 */
function decryptBuffer(encryptedBuffer) {
  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const authTag = encryptedBuffer.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encryptedBuffer.slice(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Encrypt a string (e.g., access codes) with AES-256-GCM.
 * Returns base64 encoded encrypted data.
 * @param {string} plaintext
 * @returns {string} base64 encoded encrypted data
 */
function encryptString(plaintext) {
  const plainBuffer = Buffer.from(plaintext, 'utf8');
  const encryptedBuffer = encryptBuffer(plainBuffer);
  return encryptedBuffer.toString('base64');
}

/**
 * Decrypt a base64 encoded encrypted string.
 * @param {string} encryptedBase64
 * @returns {string} plaintext
 */
function decryptString(encryptedBase64) {
  const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
  const decryptedBuffer = decryptBuffer(encryptedBuffer);
  return decryptedBuffer.toString('utf8');
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  encryptString,
  decryptString,
};
