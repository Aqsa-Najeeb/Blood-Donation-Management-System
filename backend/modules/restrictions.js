/**
 * Restrictions module stub for Member 3
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function isRestricted(userId) {
  // No-op stub returning false for foundation
  return Promise.resolve(false);
}

module.exports = {
  isRestricted,
};
