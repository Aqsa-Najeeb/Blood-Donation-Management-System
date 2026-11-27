const defaultPrisma = require("../prisma");

const ALLOWED_NOTIFICATION_TYPES = new Set([
  "REQUEST_MATCH",
  "RESPONSE_RECEIVED",
  "RESPONSE_DECISION",
  "REQUEST_CLOSED",
]);

let activePrisma = defaultPrisma;
let notifyHook = null;

function setNotificationPrisma(prismaClient) {
  activePrisma = prismaClient || defaultPrisma;
}

function setNotifyHook(fn) {
  notifyHook = typeof fn === "function" ? fn : null;
}

/**
 * Persists an in-app notification for a user if (userId, type, reference) does not already exist.
 * Rejects any type outside ALLOWED_NOTIFICATION_TYPES.
 * @param {number} userId
 * @param {{ type: string, title: string, text: string, link?: string, reference?: string }} payload
 * @returns {Promise<object>}
 */
async function notify(userId, { type, title, text, link, reference } = {}) {
  const normalizedType = String(type || "").trim().toUpperCase();
  if (!ALLOWED_NOTIFICATION_TYPES.has(normalizedType)) {
    throw new Error(
      `Invalid notification type '${type}'. Allowed: ${[...ALLOWED_NOTIFICATION_TYPES].join(", ")}.`
    );
  }

  const targetUserId = Number(userId);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw new Error("Valid userId is required for notify().");
  }

  const cleanTitle = String(title || "").trim().slice(0, 160);
  const cleanText = String(text || "").trim().slice(0, 255);
  const cleanRoute = String(link || "/requests").trim().slice(0, 80);
  const cleanRef = String(reference !== undefined ? reference : link || cleanTitle).trim().slice(0, 120);

  if (notifyHook) {
    await notifyHook(targetUserId, {
      type: normalizedType,
      title: cleanTitle,
      text: cleanText,
      link: cleanRoute,
      reference: cleanRef,
    });
  }

  const record = await activePrisma.notification.upsert({
    where: {
      userId_type_reference: {
        userId: targetUserId,
        type: normalizedType,
        reference: cleanRef,
      },
    },
    update: {},
    create: {
      userId: targetUserId,
      type: normalizedType,
      reference: cleanRef,
      title: cleanTitle,
      description: cleanText,
      route: cleanRoute,
      unread: true,
    },
  });

  return record;
}

module.exports = {
  ALLOWED_NOTIFICATION_TYPES,
  notify,
  setNotifyHook,
  setNotificationPrisma,
};
