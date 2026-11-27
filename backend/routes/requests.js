const express = require("express");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");
const { serializeRequest } = require("../utils/serializers");
const { now } = require("../utils/clock");
const { findLocation } = require("../data/locations");
const { findMatchingDonors } = require("../modules/matching");
const { notify } = require("../modules/notifications");
const { isRestricted, getActiveRestriction } = require("../modules/restrictions");
const { toPktDateString, expireDueRequests } = require("../modules/requestLifecycle");
const {
  VALID_BLOOD_GROUPS,
  sanitizeText,
  parsePositiveInt,
  isValidPhone,
} = require("../utils/validators");

const MAX_ACTIVE_REQUESTS_PER_USER = 3;
const ALLOWED_RADII = new Set([5, 10, 25, 50]);

function parseRequiredDatePkt(input) {
  if (!input) return null;
  const raw = String(input).trim();
  // Accept YYYY-MM-DD directly as PKT calendar date
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    const [, yStr, mStr, dStr] = match;
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (
      check.getUTCFullYear() !== y ||
      check.getUTCMonth() !== m - 1 ||
      check.getUTCDate() !== d
    ) {
      return null;
    }
    return {
      dateStr: `${yStr}-${mStr}-${dStr}`,
      dateObj: new Date(`${yStr}-${mStr}-${dStr}T12:00:00+05:00`),
    };
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const dateStr = toPktDateString(parsed);
  return {
    dateStr,
    dateObj: new Date(`${dateStr}T12:00:00+05:00`),
  };
}

function createRequestsRouter(prisma, { requestLimiter } = {}) {
  const router = express.Router();

  async function findRequestByIdOrCode(idOrCode) {
    const raw = String(idOrCode || "").trim();
    const numeric = parsePositiveInt(raw);
    const where = numeric ? { id: numeric } : { code: raw.toUpperCase() };
    return prisma.bloodRequest.findUnique({
      where,
      include: {
        requester: true,
        responses: {
          include: { donor: true },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  function canViewRequest(requestItem, viewer) {
    if (!requestItem || !viewer) return false;
    if (requestItem.requesterId === viewer.id) return true;
    return requestItem.bloodGroup === viewer.bloodGroup;
  }

  // GET /api/requests — owner OR same declared blood group (D4)
  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const viewer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!viewer || viewer.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }

      await expireDueRequests(prisma);

      const { status } = req.query;
      const where = {
        OR: [{ requesterId: viewer.id }, { bloodGroup: viewer.bloodGroup }],
      };
      if (status && ["OPEN", "CLOSED"].includes(String(status).trim().toUpperCase())) {
        where.status = String(status).trim().toUpperCase();
      }

      const list = await prisma.bloodRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          requester: true,
          responses: {
            include: { donor: true },
            orderBy: { id: "asc" },
          },
        },
      });
      return res.json({
        count: list.length,
        requests: list.map((r) => serializeRequest(r, viewer.id)),
      });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/requests/:idOrCode — owner OR same declared blood group, else 404 (D4)
  router.get("/:idOrCode", requireAuth, async (req, res, next) => {
    try {
      const viewer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!viewer || viewer.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }

      await expireDueRequests(prisma);

      const item = await findRequestByIdOrCode(req.params.idOrCode);
      if (!item || !canViewRequest(item, viewer)) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      return res.json({ request: serializeRequest(item, viewer.id) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/requests — create request with D1 fields, restriction check, max 3 OPEN, matching + notify
  router.post("/", requireAuth, ...(requestLimiter ? [requestLimiter] : []), async (req, res, next) => {
    try {
      const requester = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!requester || requester.deactivatedAt) {
        return res.status(401).json({ error: "Requester account not found or deactivated." });
      }

      // Check restriction BEFORE creating (blocks ANY urgency)
      const activeRestriction = await getActiveRestriction(requester.id);
      if (activeRestriction) {
        const expiresIso = new Date(activeRestriction.expiresAt).toISOString();
        return res.status(403).json({
          error: `A precautionary restriction is active until ${expiresIso} (not a verified finding). You cannot create new emergency requests while it is active.`,
          restrictedUntil: expiresIso,
          precautionary: true,
        });
      }

      const {
        bloodGroup,
        hospital,
        city,
        area,
        radius,
        requiredDate,
        units,
        urgency,
        contactPhone,
        message,
      } = req.body || {};

      if (!bloodGroup) {
        return res.status(400).json({ error: "bloodGroup is required." });
      }
      const bg = String(bloodGroup).trim().toUpperCase();
      if (!VALID_BLOOD_GROUPS.has(bg)) {
        return res.status(400).json({ error: "Invalid bloodGroup value." });
      }

      const cleanHospital = sanitizeText(hospital, 160);
      if (cleanHospital.length < 2) {
        return res.status(400).json({ error: "hospital is required." });
      }

      const cleanCity = sanitizeText(city, 80);
      const cleanArea = sanitizeText(area, 160);
      if (cleanCity.length < 2 || cleanArea.length < 2) {
        return res.status(400).json({ error: "city and area are required." });
      }
      if (!findLocation(cleanCity, cleanArea)) {
        return res.status(400).json({ error: "Selected city/area is not in the supported locations list." });
      }

      if (radius === undefined || radius === null || radius === "") {
        return res.status(400).json({ error: "radius is required." });
      }
      const parsedRadius = Number(radius);
      if (!Number.isInteger(parsedRadius) || !ALLOWED_RADII.has(parsedRadius)) {
        return res.status(400).json({ error: "radius must be 5, 10, 25, or 50 km." });
      }

      const parsedDate = parseRequiredDatePkt(requiredDate);
      if (!parsedDate) {
        return res.status(400).json({ error: "A valid requiredDate (YYYY-MM-DD) is required." });
      }
      const todayPkt = toPktDateString(now());
      if (parsedDate.dateStr < todayPkt) {
        return res.status(400).json({ error: "requiredDate must not be in the past (PKT)." });
      }

      if (units === undefined || units === null || units === "") {
        return res.status(400).json({ error: "units is required." });
      }
      const parsedUnits = Number(units);
      if (!Number.isInteger(parsedUnits) || parsedUnits < 1 || parsedUnits > 6) {
        return res.status(400).json({ error: "units must be an integer between 1 and 6." });
      }

      if (!urgency) {
        return res.status(400).json({ error: "urgency is required." });
      }
      const urgRaw = String(urgency).trim().toUpperCase();
      if (!["STANDARD", "URGENT", "EMERGENCY"].includes(urgRaw)) {
        return res.status(400).json({ error: "urgency must be STANDARD, URGENT, or EMERGENCY." });
      }

      if (!contactPhone || !isValidPhone(contactPhone)) {
        return res.status(400).json({ error: "A valid contactPhone is required." });
      }

      const cleanMessage = message ? sanitizeText(message, 1000) : null;

      // Max 3 OPEN requests per user
      const openCount = await prisma.bloodRequest.count({
        where: { requesterId: requester.id, status: "OPEN" },
      });
      if (openCount >= MAX_ACTIVE_REQUESTS_PER_USER) {
        return res.status(400).json({
          error: `You can have at most ${MAX_ACTIVE_REQUESTS_PER_USER} OPEN requests at one time.`,
        });
      }

      const code = `BR-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const created = await prisma.bloodRequest.create({
        data: {
          code,
          requesterId: requester.id,
          bloodGroup: bg,
          hospital: cleanHospital,
          city: cleanCity,
          area: cleanArea,
          radius: parsedRadius,
          requiredDate: parsedDate.dateObj,
          units: parsedUnits,
          urgency: urgRaw,
          contactPhone: sanitizeText(contactPhone, 30),
          message: cleanMessage,
          status: "OPEN",
          closureReason: null,
        },
      });

      const matches = await findMatchingDonors(prisma, created);
      if (matches.length > 0) {
        await prisma.requestResponse.createMany({
          data: matches.map((m) => ({
            requestId: created.id,
            donorId: m.donor.id,
            donorResponse: "PENDING",
            requesterDecision: "NONE",
            distanceKm: m.distance,
          })),
        });

        for (const m of matches) {
          await notify(m.donor.id, {
            type: "REQUEST_MATCH",
            reference: created.code,
            title: `${created.bloodGroup} blood request near ${created.area}`,
            text: `${created.units} unit(s) needed at ${created.hospital} (${created.urgency})`,
            link: "/requests",
          });
        }
      }

      const full = await findRequestByIdOrCode(created.id);
      return res.status(201).json({ request: serializeRequest(full, requester.id) });
    } catch (err) {
      return next(err);
    }
  });

  // PATCH /api/requests/:idOrCode/respond — donor sets donorResponse (B2)
  router.patch("/:idOrCode/respond", requireAuth, async (req, res, next) => {
    try {
      const viewer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!viewer || viewer.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }

      await expireDueRequests(prisma);

      const item = await findRequestByIdOrCode(req.params.idOrCode);
      if (!item) {
        return res.status(404).json({ error: "Blood request not found." });
      }

      // Must have a RequestResponse row (was notified)
      const responseRow = item.responses.find((r) => r.donorId === viewer.id);
      if (!responseRow) {
        return res.status(403).json({ error: "You were not notified for this request." });
      }

      // Request must be OPEN
      if (item.status !== "OPEN") {
        return res.status(409).json({ error: "This request is no longer open. Response changes are not allowed." });
      }

      const { donorResponse } = req.body || {};
      if (!donorResponse || !["ACCEPTED", "DECLINED"].includes(String(donorResponse).trim().toUpperCase())) {
        return res.status(400).json({ error: "donorResponse must be ACCEPTED or DECLINED." });
      }
      const newResponse = String(donorResponse).trim().toUpperCase();

      // Build update data
      const updateData = {
        donorResponse: newResponse,
        respondedAt: now(),
      };

      // If changing from ACCEPTED to DECLINED, reset requesterDecision to NONE (D3)
      if (responseRow.donorResponse === "ACCEPTED" && newResponse === "DECLINED") {
        updateData.requesterDecision = "NONE";
        updateData.decidedAt = null;
      }

      const updated = await prisma.requestResponse.update({
        where: { id: responseRow.id },
        data: updateData,
        include: { donor: true, request: { include: { requester: true } } },
      });

      // Notify the requester that a donor responded
      await notify(item.requesterId, {
        type: "RESPONSE_RECEIVED",
        reference: `${item.code}:donor:${viewer.id}:${newResponse}`,
        title: `Donor responded to ${item.code}`,
        text: `${viewer.name} has ${newResponse.toLowerCase()} your request (willing to be contacted).`,
        link: "/requests",
      });

      const full = await findRequestByIdOrCode(item.id);
      return res.json({ request: serializeRequest(full, viewer.id) });
    } catch (err) {
      return next(err);
    }
  });

  // PATCH /api/requests/:idOrCode/decide/:responseId — requester sets requesterDecision (B2)
  router.patch("/:idOrCode/decide/:responseId", requireAuth, async (req, res, next) => {
    try {
      const viewer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!viewer || viewer.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }

      const item = await findRequestByIdOrCode(req.params.idOrCode);
      if (!item) {
        return res.status(404).json({ error: "Blood request not found." });
      }

      // Only the requester can decide
      if (item.requesterId !== viewer.id) {
        return res.status(403).json({ error: "Only the requester can approve or reject donors." });
      }

      const responseId = parsePositiveInt(req.params.responseId);
      if (!responseId) {
        return res.status(400).json({ error: "Invalid responseId." });
      }

      const responseRow = item.responses.find((r) => r.id === responseId);
      if (!responseRow) {
        return res.status(404).json({ error: "Response not found for this request." });
      }

      // donorResponse must be ACCEPTED to allow requester decision (D3)
      if (responseRow.donorResponse !== "ACCEPTED") {
        return res.status(400).json({
          error: "Requester decision is only allowed when the donor has accepted (donorResponse = ACCEPTED).",
        });
      }

      const { requesterDecision } = req.body || {};
      if (!requesterDecision || !["APPROVED", "REJECTED"].includes(String(requesterDecision).trim().toUpperCase())) {
        return res.status(400).json({ error: "requesterDecision must be APPROVED or REJECTED." });
      }
      const newDecision = String(requesterDecision).trim().toUpperCase();

      await prisma.requestResponse.update({
        where: { id: responseRow.id },
        data: {
          requesterDecision: newDecision,
          decidedAt: now(),
        },
      });

      // Notify the donor about the requester's decision
      await notify(responseRow.donorId, {
        type: "RESPONSE_DECISION",
        reference: `${item.code}:decision:${newDecision}`,
        title: `Your response was ${newDecision.toLowerCase()}`,
        text: `The requester has ${newDecision.toLowerCase()} your response to ${item.code}. ${
          newDecision === "APPROVED"
            ? "You are now approved — the requester's contact details are visible."
            : "Thank you for being willing to help."
        }`,
        link: "/requests",
      });

      const full = await findRequestByIdOrCode(item.id);
      return res.json({ request: serializeRequest(full, viewer.id) });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/requests/:idOrCode/responses — requester sees all responses (B2, BR-24)
  router.get("/:idOrCode/responses", requireAuth, async (req, res, next) => {
    try {
      const viewer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!viewer || viewer.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }

      await expireDueRequests(prisma);

      const item = await findRequestByIdOrCode(req.params.idOrCode);
      if (!item) {
        return res.status(404).json({ error: "Blood request not found." });
      }

      // Only the requester can see responses list
      if (item.requesterId !== viewer.id) {
        return res.status(403).json({ error: "Only the requester can view responses." });
      }

      // Responses stay visible after close (BR-24)
      const responses = item.responses.map((r) => ({
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
              area: r.donor.area,
              city: r.donor.city,
            }
          : undefined,
      }));

      return res.json({
        requestId: item.id,
        code: item.code,
        status: item.status,
        count: responses.length,
        responses,
      });
    } catch (err) {
      return next(err);
    }
  });

  function createCloseHandler(closureReason) {
    return async (req, res, next) => {
      try {
        const viewer = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!viewer || viewer.deactivatedAt) {
          return res.status(401).json({ error: "Account not found or deactivated." });
        }

        await expireDueRequests(prisma);

        const item = await findRequestByIdOrCode(req.params.idOrCode);
        if (!item) {
          return res.status(404).json({ error: "Blood request not found." });
        }

        if (item.requesterId !== viewer.id) {
          return res.status(403).json({ error: "Only the requester who created this request can close it." });
        }

        if (item.status !== "OPEN") {
          return res.status(409).json({
            error: `Request is already closed (${item.closureReason || "CLOSED"}).`,
          });
        }

        const updated = await prisma.bloodRequest.updateMany({
          where: { id: item.id, status: "OPEN" },
          data: { status: "CLOSED", closureReason },
        });

        if (updated.count === 0) {
          return res.status(409).json({ error: "Request is already closed." });
        }

        const actionLabel = closureReason === "CANCELLED" ? "cancelled" : "marked as fulfilled";
        const notifiedDonorIds = [...new Set((item.responses || []).map((r) => r.donorId))];
        for (const donorId of notifiedDonorIds) {
          await notify(donorId, {
            type: "REQUEST_CLOSED",
            reference: `${item.code}:${closureReason}`,
            title: `Request ${item.code} ${actionLabel}`,
            text: `The ${item.bloodGroup} blood request at ${item.hospital} has been ${actionLabel} by the requester.`,
            link: "/requests",
          });
        }

        const full = await findRequestByIdOrCode(item.id);
        return res.json({ request: serializeRequest(full, viewer.id) });
      } catch (err) {
        return next(err);
      }
    };
  }

  // POST /api/requests/:idOrCode/cancel — owner cancels OPEN request (FR-12, BR-10, D2)
  router.post("/:idOrCode/cancel", requireAuth, createCloseHandler("CANCELLED"));

  // POST /api/requests/:idOrCode/fulfil — owner marks OPEN request fulfilled (D2)
  router.post("/:idOrCode/fulfil", requireAuth, createCloseHandler("FULFILLED"));

  return router;
}

module.exports = createRequestsRouter;
