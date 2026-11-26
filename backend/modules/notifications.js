let notifyHook = null;

function setNotifyHook(fn) {
  notifyHook = typeof fn === "function" ? fn : null;
}

/**
 * Notification module stub for Member 3
 * @param {number} userId
 * @param {{ type: string, title: string, text: string, link?: string }} payload
 * @returns {Promise<void>}
 */
async function notify(userId, { type, title, text, link } = {}) {
  if (notifyHook) {
    await notifyHook(userId, { type, title, text, link });
  }
  return Promise.resolve();
}

module.exports = {
  notify,
  setNotifyHook,
};
