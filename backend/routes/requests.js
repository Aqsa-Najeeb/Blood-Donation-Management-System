const express = require("express");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");
const { serializeRequest } = require("../utils/serializers");
const { now } = require("../utils/clock");
const {
  VALID_BLOOD_GROUPS,
  sanitizeText,
  parsePositiveInt,
  isRestrictedActive,
} = require("../utils/validators");

const MAX_CONCURRENT_DONORS = 3;
const MAX_ACTIVE_REQUESTS_PER_USER = 3;

function createRequestsRouter(prisma, { requestLimiter } = {}) {
  const router = express.Router();

  async function findRequestByIdOrCode(idOrCode) {
    const raw = String(idOrCode || "").trim();
    const numeric = parsePositiveInt(raw);
    const where = numeric ? { id: numeric } : { code: raw.toUpperCase() };
    return prisma.bloodRequest.findUnique({
      where,
      include: {
        invitations: {
          include: { donor: true },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  function isRequestParticipant(requestItem, user) {
    if (!requestItem || !user) return false;
    if (requestItem.requesterId === user.id) return true;
    return (requestItem.invitations || []).some((i) => i.donorId === user.id);
  }

  function isRequestOwner(requestItem, user) {
    if (!requestItem || !user) return false;
    return requestItem.requesterId === user.id;
  }

  // GET /api/requests — scoped to requester or invited donors
  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const { status } = req.query;
      const where = {};
      if (status && ["ACTIVE", "FULFILLED", "CANCELLED"].includes(String(status).toUpperCase())) {
        where.status = String(status).toUpperCase();
      }
      where.OR = [
        { requesterId: req.user.id },
        { invitations: { some: { donorId: req.user.id } } },
      ];

      const list = await prisma.bloodRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          invitations: {
            include: { donor: true },
            orderBy: { id: "asc" },
          },
        },
      });
      return res.json({ count: list.length, requests: list.map((r) => serializeRequest(r)) });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/requests/:idOrCode
  router.get("/:idOrCode", requireAuth, async (req, res, next) => {
    try {
      const item = await findRequestByIdOrCode(req.params.idOrCode);
      if (!item) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (!isRequestParticipant(item, req.user)) {
        return res.status(403).json({ error: "Forbidden: you do not have access to this blood request." });
      }
      return res.json({ request: serializeRequest(item) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/requests
  router.post("/", requireAuth, ...(requestLimiter ? [requestLimiter] : []), async (req, res, next) => {
    try {
      const { bloodGroup, units = 1, caseCategory, urgency = "URGENT", hospital, ward, city, requiredBy, notes } =
        req.body || {};

      const cleanHospital = sanitizeText(hospital, 140);
      if (!bloodGroup || cleanHospital.length < 2) {
        return res.status(400).json({ error: "Valid bloodGroup and hospital (2+ chars) are required." });
      }

      const bg = String(bloodGroup).trim().toUpperCase();
      if (!VALID_BLOOD_GROUPS.has(bg)) {
        return res.status(400).json({ error: "Invalid bloodGroup value." });
      }

      const parsedUnits = Number(units);
      if (!Number.isInteger(parsedUnits) || parsedUnits < 1 || parsedUnits > 6) {
        return res.status(400).json({ error: "units must be an integer between 1 and 6." });
      }

      const urgRaw = String(urgency).trim().toUpperCase();
      if (!["STANDARD", "URGENT", "EMERGENCY"].includes(urgRaw)) {
        return res.status(400).json({ error: "urgency must be STANDARD, URGENT, or EMERGENCY." });
      }

      const requester = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!requester || requester.seenLabel === "Deactivated") {
        return res.status(401).json({ error: "Requester account not found or deactivated." });
      }

      // Enforce 7-day temporary restriction on creating new emergency requests
      if (urgRaw === "EMERGENCY" && isRestrictedActive(requester)) {
        return res.status(403).json({
          error: "Account is temporarily restricted for 7 days from creating new emergency requests due to community safety reports.",
          restrictedUntil: requester.restrictedUntil,
        });
      }

      // Anti-spam: enforce max concurrent active requests & duplicate request guard
      const existingActive = await prisma.bloodRequest.findMany({
        where: { requesterId: requester.id, status: "ACTIVE" },
      });
      if (existingActive.length >= MAX_ACTIVE_REQUESTS_PER_USER) {
        return res.status(429).json({
          error: `You can have at most ${MAX_ACTIVE_REQUESTS_PER_USER} active blood requests at one time.`,
        });
      }

      const duplicate = existingActive.some(
        (r) => r.bloodGroup === bg && r.hospital.toLowerCase() === cleanHospital.toLowerCase()
      );
      if (duplicate) {
        return res.status(409).json({
          error: "An active blood request for this blood group and hospital already exists.",
        });
      }

      const matchingDonors = await prisma.user.findMany({
        where: {
          isDonor: true,
          bloodGroup: bg,
          available: true,
          online: true,
          seenLabel: { not: "Deactivated" },
          id: { not: requester.id },
        },
        orderBy: { distanceKm: "asc" },
        take: MAX_CONCURRENT_DONORS,
      });

      const code = `BR-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const created = await prisma.bloodRequest.create({
        data: {
          code,
          requesterId: requester.id,
          bloodGroup: bg,
          units: parsedUnits,
          caseCategory: sanitizeText(caseCategory, 120) || "Scheduled Surgical Intervention",
          urgency: urgRaw,
          hospital: cleanHospital,
          ward: sanitizeText(ward, 120) || "Transfusion Ward",
          city: sanitizeText(city, 100) || "Lahore, Punjab",
          requiredBy: sanitizeText(requiredBy, 80) || "Within 12 hours",
          patientName: `${requester.name} (Patient Requisition)`,
          attendantName: requester.name,
          labId: `LAB-${crypto.randomInt(10000, 99999)}`,
          slipNumber: `#${crypto.randomInt(500, 999)}`,
          stage: 1,
          status: "ACTIVE",
          notes: notes ? sanitizeText(notes, 1000) : null,
          invitations: {
            create: matchingDonors.map((d, idx) => ({
              donorId: d.id,
              status: idx === 0 ? "PENDING" : "ON_HOLD",
              eta: `~${Math.round(d.distanceKm * 4 + 8)} Mins`,
              targetTime: "Pending",
              distanceLabel: `${d.distanceKm} km away`,
              trafficNote: "Normal traffic",
              pulseStatus: "Alert Pushed",
              pulseNote: "Controlled 3-donor cap",
              respondedAt: "Pinged just now",
              reason: idx > 0 ? "Queued in 3-donor controlled slot until primary donor responds." : null,
            })),
          },
        },
        include: {
          invitations: {
            include: { donor: true },
            orderBy: { id: "asc" },
          },
        },
      });

      return res.status(201).json({ request: serializeRequest(created) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/requests/:idOrCode/invite — owner only
  router.post("/:idOrCode/invite", requireAuth, async (req, res, next) => {
    try {
      const target = await findRequestByIdOrCode(req.params.idOrCode);
      if (!target) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (!isRequestOwner(target, req.user)) {
        return res.status(403).json({ error: "Forbidden: only the request creator can invite donors." });
      }
      if (target.status !== "ACTIVE") {
        return res.status(400).json({ error: "Cannot invite donors to a fulfilled or cancelled request." });
      }

      const { donorIds } = req.body || {};
      if (!Array.isArray(donorIds) || donorIds.length === 0) {
        return res.status(400).json({ error: "donorIds array is required." });
      }

      const existingIds = new Set(target.invitations.map((i) => i.donorId));
      const parsedIds = [...new Set(donorIds.map(parsePositiveInt))];
      if (parsedIds.some((id) => id === null)) {
        return res.status(400).json({ error: "All donorIds must be valid positive integers." });
      }

      const newIds = parsedIds.filter((id) => !existingIds.has(id) && id !== req.user.id);
      if (newIds.length === 0) {
        return res.status(400).json({ error: "No eligible new donorIds provided." });
      }

      if (target.invitations.length + newIds.length > MAX_CONCURRENT_DONORS) {
        return res.status(400).json({
          error: `Controlled Request Protocol allows a maximum of ${MAX_CONCURRENT_DONORS} donors per request.`,
        });
      }

      const donors = await prisma.user.findMany({
        where: { id: { in: newIds }, isDonor: true, seenLabel: { not: "Deactivated" } },
      });

      for (const d of donors) {
        await prisma.requestInvitation.create({
          data: {
            requestId: target.id,
            donorId: d.id,
            status: "PENDING",
            eta: `~${Math.max(12, Math.round(d.distanceKm * 4))} Mins`,
            targetTime: "In 25 mins",
            distanceLabel: `${d.distanceKm} km away`,
            trafficNote: "Moderate traffic",
            pulseStatus: "Ping Sent",
            pulseNote: "Awaiting confirmation",
            respondedAt: "Invited just now",
          },
        });
      }

      const updated = await findRequestByIdOrCode(target.id);
      return res.json({ request: serializeRequest(updated) });
    } catch (err) {
      return next(err);
    }
  });

  // PATCH /api/requests/:idOrCode/stage — owner only
  router.patch("/:idOrCode/stage", requireAuth, async (req, res, next) => {
    try {
      const target = await findRequestByIdOrCode(req.params.idOrCode);
      if (!target) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (!isRequestOwner(target, req.user)) {
        return res.status(403).json({ error: "Forbidden: only the request creator can update stage." });
      }
      if (target.status === "CANCELLED") {
        return res.status(400).json({ error: "Cannot update stage of a cancelled request." });
      }

      const stage = Number(req.body?.stage);
      if (!Number.isInteger(stage) || stage < 1 || stage > 5) {
        return res.status(400).json({ error: "stage must be an integer between 1 and 5." });
      }

      const fulfilled = stage >= 5;
      const updated = await prisma.bloodRequest.update({
        where: { id: target.id },
        data: {
          stage,
          status: fulfilled ? "FULFILLED" : "ACTIVE",
          crossMatchStatus: fulfilled
            ? "Transfusion Fulfilled"
            : stage === 4
            ? "Lab Cross-Match In Progress"
            : target.crossMatchStatus,
        },
        include: {
          invitations: { include: { donor: true }, orderBy: { id: "asc" } },
        },
      });
      return res.json({ request: serializeRequest(updated) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/requests/:idOrCode/reactivate/:donorId — owner only
  router.post("/:idOrCode/reactivate/:donorId", requireAuth, async (req, res, next) => {
    try {
      const target = await findRequestByIdOrCode(req.params.idOrCode);
      if (!target) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (!isRequestOwner(target, req.user)) {
        return res.status(403).json({ error: "Forbidden: only the request creator can reactivate donors." });
      }
      if (target.status !== "ACTIVE") {
        return res.status(400).json({ error: "Only active requests can reactivate standby donors." });
      }

      const donorId = parsePositiveInt(req.params.donorId);
      if (!donorId) {
        return res.status(400).json({ error: "Invalid donorId." });
      }
      const invite = target.invitations.find((i) => i.donorId === donorId);
      if (!invite) {
        return res.status(404).json({ error: "Standby donor invitation not found on this request." });
      }

      await prisma.requestInvitation.updateMany({
        where: { requestId: target.id, status: "ACCEPTED" },
        data: { status: "ON_HOLD", respondedAt: "Moved to standby" },
      });

      await prisma.requestInvitation.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          eta: "~18 Mins",
          targetTime: "3:25 PM",
          pulseStatus: "Active",
          pulseNote: "Reactivated standby",
          respondedAt: "Reactivated just now",
        },
      });

      const updated = await findRequestByIdOrCode(target.id);
      return res.json({ request: serializeRequest(updated) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/requests/:idOrCode/cancel — owner only
  router.post("/:idOrCode/cancel", requireAuth, async (req, res, next) => {
    try {
      const target = await findRequestByIdOrCode(req.params.idOrCode);
      if (!target) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (!isRequestOwner(target, req.user)) {
        return res.status(403).json({ error: "Forbidden: only the request creator can cancel this request." });
      }

      const updated = await prisma.bloodRequest.update({
        where: { id: target.id },
        data: { status: "CANCELLED" },
        include: {
          invitations: { include: { donor: true }, orderBy: { id: "asc" } },
        },
      });
      return res.json({ request: serializeRequest(updated) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/requests/:idOrCode/rate — owner only, fulfilled requests only
  router.post("/:idOrCode/rate", requireAuth, async (req, res, next) => {
    try {
      const target = await findRequestByIdOrCode(req.params.idOrCode);
      if (!target) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (!isRequestOwner(target, req.user)) {
        return res.status(403).json({ error: "Forbidden: only the request creator can rate this request." });
      }
      if (target.status !== "FULFILLED") {
        return res.status(400).json({ error: "Only fulfilled requests can be rated." });
      }

      const rating = Number(req.body?.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "rating must be an integer between 1 and 5." });
      }

      const updated = await prisma.bloodRequest.update({
        where: { id: target.id },
        data: { rating },
        include: {
          invitations: { include: { donor: true }, orderBy: { id: "asc" } },
        },
      });
      return res.json({ request: serializeRequest(updated) });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createRequestsRouter;
