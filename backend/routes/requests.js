const express = require("express");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");
const { serializeRequest } = require("../utils/serializers");
const { now } = require("../utils/clock");
const { findLocation } = require("../data/locations");
const { findMatchingDonors } = require("../modules/matching");
const { notify } = require("../modules/notifications");
const { isRestricted } = require("../modules/restrictions");
const {
  VALID_BLOOD_GROUPS,
  sanitizeText,
  parsePositiveInt,
  isValidPhone,
} = require("../utils/validators");

const MAX_ACTIVE_REQUESTS_PER_USER = 3;
const ALLOWED_RADII = new Set([5, 10, 25, 50]);
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function toPktDateString(date) {
  const pkt = new Date(date.getTime() + PKT_OFFSET_MS);
  const y = pkt.getUTCFullYear();
  const m = String(pkt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(pkt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
      if (await isRestricted(requester.id)) {
        return res.status(403).json({
          error: "Account is temporarily restricted from creating new emergency requests.",
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
            type: "EMERGENCY_REQUEST",
            title: `${created.bloodGroup} blood request near ${created.area}`,
            text: `${created.units} unit(s) needed at ${created.hospital} (${created.urgency})`,
            link: `/request-track?id=${created.code}`,
          });
        }
      }

      const full = await findRequestByIdOrCode(created.id);
      return res.status(201).json({ request: serializeRequest(full, requester.id) });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createRequestsRouter;
