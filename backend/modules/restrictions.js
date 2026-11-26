let restrictionOverride = null;

/**
 * Restrictions module stub for Member 3 (overridable in tests)
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function isRestricted(userId) {
  if (typeof restrictionOverride === "function") {
    return Boolean(await restrictionOverride(userId));
  }
  if (restrictionOverride !== null) {
    return Boolean(restrictionOverride);
  }
  return false;
}

function setRestrictionOverride(val) {
  restrictionOverride = val === undefined ? null : val;
}

module.exports = {
  isRestricted,
  setRestrictionOverride,
};
