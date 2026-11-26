function sanitizeUser(user, { includePrivate = false } = {}) {
  if (!user) return null;

  const isDeactivated = Boolean(user.deactivatedAt);

  const base = {
    id: user.id,
    name: isDeactivated ? "Deleted user" : user.name,
    username: isDeactivated ? "deleted_user" : user.username,
    bloodGroup: user.bloodGroup,
    city: user.city,
    area: user.area,
    shortArea: user.shortArea,
    isDonor: Boolean(user.isDonor),
    available: user.available,
    online: user.online,
    seenLabel: user.seenLabel,
    replyLabel: user.replyLabel,
    donorIdCode: user.donorIdCode,
    matchingRadiusKm: user.matchingRadiusKm,
    safetyFlags: user.safetyFlags,
    restrictedUntil: user.restrictedUntil,
    lastAvailabilityUpdate: user.lastAvailabilityUpdate || null,
    deactivatedAt: user.deactivatedAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (includePrivate && !isDeactivated) {
    base.email = user.email;
    base.phone = user.phone;
    base.strictPhoneShielding = user.strictPhoneShielding;
  } else {
    base.phone = isDeactivated ? null : user.phone ? maskPhone(user.phone) : null;
  }

  return base;
}

function maskPhone(phone) {
  const p = String(phone || "").trim();
  if (p.length < 8) return "03••-•••••••";
  return `${p.slice(0, 4)}••••${p.slice(-3)}`;
}

function serializeRequest(requestItem) {
  if (!requestItem) return null;
  return {
    ...requestItem,
    requester: requestItem.requester
      ? sanitizeUser(requestItem.requester, { includePrivate: false })
      : undefined,
    invitations: Array.isArray(requestItem.invitations)
      ? requestItem.invitations.map((i) => ({
          ...i,
          donor: i.donor ? sanitizeUser(i.donor, { includePrivate: false }) : undefined,
        }))
      : undefined,
  };
}

function serializeSearchDonor(user, { distance, freshness, isOutdated }) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    bloodGroup: user.bloodGroup,
    city: user.city,
    area: user.area,
    available: Boolean(user.available),
    availabilityLabel: user.available ? "Available" : "Unavailable",
    distance,
    lastAvailabilityUpdate: user.lastAvailabilityUpdate || null,
    freshness,
    isOutdated: Boolean(isOutdated),
  };
}

module.exports = {
  sanitizeUser,
  serializeSearchDonor,
  maskPhone,
  serializeRequest,
};
