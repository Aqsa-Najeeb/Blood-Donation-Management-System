/**
 * Notification module stub for Member 3
 * @param {number} userId
 * @param {{ type: string, title: string, text: string, link?: string }} payload
 * @returns {Promise<void>}
 */
async function notify(userId, { type, title, text, link } = {}) {
  // No-op stub for foundation
  return Promise.resolve();
}

module.exports = {
  notify,
};
