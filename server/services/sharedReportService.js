const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateChallengeCode } = require('../utils/codeUtils');
const { encryptString, decryptString } = require('../utils/encryptionUtils');

const prisma = new PrismaClient();

/**
 * Creates a share link and snapshot for the given report.
 * @param {string} reportId
 * @param {string} userId
 * @param {('VIEW'|'COMMENT')} accessLevel
 * @param {Date|null} expiresAt
 * @returns {Promise<{shareLink: object, plainCode: string}>}
 */
async function createShareLink(reportId, userId, accessLevel = 'VIEW', expiresAt = null) {
  // Set default expiry to 2 weeks from now if not provided
  if (!expiresAt) {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    expiresAt = twoWeeksFromNow;
  }

  // Fetch the report with sections to include in snapshot
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      sections: {
        orderBy: { displayOrder: 'asc' },
        include: {
          department: true,
          updatedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!report) {
    const err = new Error('Report not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Take immutable snapshot  (we remove fields that might be undefined for JSON)
  const snapshot = JSON.parse(JSON.stringify(report));

  const plainCode = generateChallengeCode(6, false);
  const codeHash = await bcrypt.hash(plainCode, 10);
  const codeEncrypted = encryptString(plainCode);

  const shareLink = await prisma.sharedReportLink.create({
    data: {
      reportId,
      snapshotJson: snapshot,
      accessLevel,
      codeHash,
      codeEncrypted,
      expiresAt,
      createdById: userId,
    },
    select: {
      id: true,
      reportId: true,
      accessLevel: true,
      expiresAt: true,
      createdById: true,
      createdAt: true,
    },
  });

  return { shareLink, plainCode };
}

/**
 * Lists share links for a report with decrypted codes for authorized users
 */
async function listShareLinks(reportId) {
  const links = await prisma.sharedReportLink.findMany({
    where: { reportId },
    select: {
      id: true,
      reportId: true,
      accessLevel: true,
      codeEncrypted: true,
      expiresAt: true,
      createdById: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Decrypt codes for display
  return links.map(link => ({
    ...link,
    code: decryptString(link.codeEncrypted),
    codeEncrypted: undefined, // Remove encrypted version from response
  }));
}

/**
 * Deletes (revokes) a share link.
 */
async function revokeShareLink(shareId) {
  try {
    await prisma.sharedReportLink.delete({ where: { id: shareId } });
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Share link not found');
      e.code = 'NOT_FOUND';
      throw e;
    }
    throw err;
  }
}

/**
 * Validates code and returns snapshot.
 * Throws errors with code: NOT_FOUND | INVALID_CODE | EXPIRED
 */
async function getSnapshot(shareId, plainCode) {
  const link = await prisma.sharedReportLink.findUnique({ where: { id: shareId } });
  if (!link) {
    const err = new Error('Share link not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    const err = new Error('Link expired');
    err.code = 'EXPIRED';
    throw err;
  }

  const valid = await bcrypt.compare(plainCode, link.codeHash);
  if (!valid) {
    const err = new Error('Invalid code');
    err.code = 'INVALID_CODE';
    throw err;
  }

  return link.snapshotJson;
}

/**
 * Regenerates the access code for a share link
 * @param {string} shareId
 * @returns {Promise<{shareLink: object, plainCode: string}>}
 */
async function regenerateShareCode(shareId) {
  // Check if share link exists
  const existingLink = await prisma.sharedReportLink.findUnique({ 
    where: { id: shareId },
    select: { id: true, reportId: true }
  });
  
  if (!existingLink) {
    const err = new Error('Share link not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Generate new code
  const plainCode = generateChallengeCode(6, false);
  const codeHash = await bcrypt.hash(plainCode, 10);
  const codeEncrypted = encryptString(plainCode);

  // Update the share link with new codes
  const shareLink = await prisma.sharedReportLink.update({
    where: { id: shareId },
    data: {
      codeHash,
      codeEncrypted,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      reportId: true,
      accessLevel: true,
      expiresAt: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { shareLink, plainCode };
}

module.exports = {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  getSnapshot,
  regenerateShareCode,
};
