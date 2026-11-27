"use strict";

const defaultPrisma = require("../prisma");
const { now } = require("../utils/clock");

let activePrisma = defaultPrisma;
let restrictionOverride = null;

function setRestrictionPrisma(prismaClient) {
  activePrisma = prismaClient || defaultPrisma;
}

function setRestrictionOverride(val) {
  restrictionOverride = val === undefined ? null : val;
}

/**
 * Returns the active RestrictionRecord for userId if now() < expiresAt, else null.
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function getActiveRestriction(userId) {
  if (typeof restrictionOverride === "function") {
    const overridden = await restrictionOverride(userId);
    if (!overridden) return null;
    return {
      userId,
      reason: "Automated precautionary restriction (not a verified finding).",
      startsAt: now(),
      expiresAt: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }
  if (restrictionOverride !== null) {
    if (!restrictionOverride) return null;
    return {
      userId,
      reason: "Automated precautionary restriction (not a verified finding).",
      startsAt: now(),
      expiresAt: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  const current = now();
  return activePrisma.restrictionRecord.findFirst({
    where: {
      userId,
      expiresAt: { gt: current },
    },
    orderBy: { expiresAt: "desc" },
  });
}

/**
 * Returns true while now() is strictly before expiresAt of an active RestrictionRecord.
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function isRestricted(userId) {
  const record = await getActiveRestriction(userId);
  return Boolean(record);
}

module.exports = {
  isRestricted,
  getActiveRestriction,
  setRestrictionOverride,
  setRestrictionPrisma,
};
