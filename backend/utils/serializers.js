const { getExpiryAt } = require("../modules/requestLifecycle");

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
    lastAvailabilityUpdate: user.lastAvailabilityUpdate || null,
    deactivatedAt: user.deactivatedAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (includePrivate && !isDeactivated) {
    base.email = user.email;
    base.phone = user.phone;
    base.strictPhoneShielding = user.strictPhoneShielding;
    base.safetyFlags = user.safetyFlags;
    base.restrictedUntil = user.restrictedUntil;
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

function serializeRequest(requestItem, viewerId = null) {
  if (!requestItem) return null;
  const isOwner = viewerId !== null && requestItem.requesterId === viewerId;
  const isApprovedDonor =
    viewerId !== null &&
    Array.isArray(requestItem.responses) &&
    requestItem.responses.some((r) => r.donorId === viewerId && r.requesterDecision === "APPROVED");

  const result = {
    id: requestItem.id,
    code: requestItem.code,
    requesterId: requestItem.requesterId,
    bloodGroup: requestItem.bloodGroup,
    hospital: requestItem.hospital,
    city: requestItem.city,
    area: requestItem.area,
    radius: requestItem.radius,
    requiredDate: requestItem.requiredDate,
    units: requestItem.units,
    urgency: requestItem.urgency,
    message: requestItem.message ?? null,
    status: requestItem.status,
    closureReason: requestItem.closureReason ?? null,
    expiresAt: requestItem.requiredDate ? getExpiryAt(requestItem.requiredDate).toISOString() : null,
    createdAt: requestItem.createdAt,
    updatedAt: requestItem.updatedAt,
    requester: requestItem.requester
      ? sanitizeUser(requestItem.requester, { includePrivate: false })
      : undefined,
    responses: Array.isArray(requestItem.responses)
      ? requestItem.responses
          .filter((r) => isOwner || (viewerId !== null && r.donorId === viewerId))
          .map((r) => ({
            id: r.id,
            requestId: r.requestId,
            donorId: r.donorId,
            donorResponse: r.donorResponse,
            requesterDecision: r.requesterDecision,
            distanceKm: r.distanceKm ?? null,
            respondedAt: r.respondedAt ?? null,
            decidedAt: r.decidedAt ?? null,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            donor: r.donor
              ? {
                  id: r.donor.id,
                  name: r.donor.deactivatedAt ? "Deleted user" : r.donor.name,
                  bloodGroup: r.donor.bloodGroup,
                  city: r.donor.city,
                  area: r.donor.area,
                }
              : undefined,
          }))
      : undefined,
  };

  if (isOwner || isApprovedDonor) {
    result.contactPhone = requestItem.contactPhone;
  }

  return result;
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
