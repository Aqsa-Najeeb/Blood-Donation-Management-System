const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { serializeSearchDonor } = require("../utils/serializers");
const { VALID_BLOOD_GROUPS, parsePositiveInt } = require("../utils/validators");
const { LOCATIONS, findLocation } = require("../data/locations");
const { haversineDistance } = require("../utils/distance");
const { now } = require("../utils/clock");

const ALLOWED_RADII = new Set([5, 10, 25, 50]);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function createDonorsRouter(prisma) {
  const router = express.Router();

  // GET /api/donors/locations — static list of supported city/area pairs (D6)
  router.get("/locations", (_req, res) => {
    return res.json({ locations: LOCATIONS });
  });

  // GET /api/donors/availability — live counts by blood group (no fake baseline)
  router.get("/availability", async (_req, res, next) => {
    try {
      const counts = await prisma.user.groupBy({
        by: ["bloodGroup"],
        where: { isDonor: true, available: true, deactivatedAt: null },
        _count: { id: true },
      });
      const dbMap = new Map(counts.map((c) => [c.bloodGroup, c._count.id]));

      const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      const items = bloodTypes.map((type) => {
        const liveCount = dbMap.get(type) || 0;
        return {
          type,
          count: liveCount,
          liveRegistered: liveCount,
          status: liveCount > 3 ? "Optimal" : liveCount > 0 ? "Moderate" : "Low",
          badge: "Declared",
        };
      });

      return res.json({ availability: items, updatedAt: now().toISOString() });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/donors — authenticated donor search (FR-05, FR-06, BR-06, BR-17, BR-18, BR-19, NFR-04)
  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const { bloodGroup, city, area, radius } = req.query;

      let bgFilter = null;
      if (bloodGroup !== undefined && bloodGroup !== "" && bloodGroup !== "All") {
        const bg = String(bloodGroup).trim().toUpperCase();
        if (!VALID_BLOOD_GROUPS.has(bg)) {
          return res.status(400).json({ error: "Invalid bloodGroup filter." });
        }
        bgFilter = bg;
      }

      let maxKm = null;
      if (radius !== undefined && radius !== "" && radius !== "All") {
        const r = Number(radius);
        if (!Number.isInteger(r) || !ALLOWED_RADII.has(r)) {
          return res.status(400).json({ error: "radius must be one of 5, 10, 25, or 50 km." });
        }
        maxKm = r;
      }

      let searchLoc = null;
      if (city || area) {
        searchLoc = findLocation(city, area);
        if (!searchLoc) {
          return res.status(400).json({ error: "Selected city/area is not in the supported locations list." });
        }
      } else {
        searchLoc = LOCATIONS[0];
      }

      const where = {
        isDonor: true,
        deactivatedAt: null,
        ...(bgFilter ? { bloodGroup: bgFilter } : {}),
      };

      const donors = await prisma.user.findMany({ where });
      const currentMs = now().getTime();

      const matched = [];
      for (const d of donors) {
        const donorLoc = findLocation(d.city, d.area) || LOCATIONS[0];
        const distance = haversineDistance(
          searchLoc.latitude,
          searchLoc.longitude,
          donorLoc.latitude,
          donorLoc.longitude
        );

        if (maxKm !== null && distance > maxKm) {
          continue;
        }

        const refTime = d.lastAvailabilityUpdate ? new Date(d.lastAvailabilityUpdate).getTime() : null;
        const isOutdated = refTime !== null && currentMs - refTime > SEVEN_DAYS_MS;
        const freshness = isOutdated ? "May be outdated" : "Fresh";

        matched.push({
          donor: d,
          distance,
          freshness,
          isOutdated,
          updateMs: refTime || 0,
        });
      }

      matched.sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return b.updateMs - a.updateMs;
      });

      return res.json({
        count: matched.length,
        donors: matched.map((m) =>
          serializeSearchDonor(m.donor, {
            distance: m.distance,
            freshness: m.freshness,
            isOutdated: m.isOutdated,
          })
        ),
      });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/donors/:id — authenticated donor view (no phone/email)
  router.get("/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "Invalid donor id." });
      }
      const donor = await prisma.user.findFirst({
        where: { id, isDonor: true, deactivatedAt: null },
      });
      if (!donor) {
        return res.status(404).json({ error: "Donor not found." });
      }
      const currentMs = now().getTime();
      const refTime = donor.lastAvailabilityUpdate ? new Date(donor.lastAvailabilityUpdate).getTime() : null;
      const isOutdated = refTime !== null && currentMs - refTime > SEVEN_DAYS_MS;
      const freshness = isOutdated ? "May be outdated" : "Fresh";

      return res.json({
        donor: serializeSearchDonor(donor, {
          distance: null,
          freshness,
          isOutdated,
        }),
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/donors/:id/contact — reveal phone only to signed-in user (FR-07, BR-21)
  router.post("/:id/contact", requireAuth, async (req, res, next) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "Invalid donor id." });
      }
      const donor = await prisma.user.findFirst({
        where: { id, isDonor: true, deactivatedAt: null },
      });
      if (!donor) {
        return res.status(404).json({ error: "Donor not found." });
      }
      return res.json({
        donorId: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        phone: donor.phone,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createDonorsRouter;
