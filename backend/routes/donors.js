const express = require("express");
const { sanitizeUser } = require("../utils/serializers");
const { VALID_BLOOD_GROUPS, parsePositiveInt, sanitizeText } = require("../utils/validators");

function createDonorsRouter(prisma) {
  const router = express.Router();

  // GET /api/donors/availability
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

      return res.json({ availability: items, updatedAt: new Date().toISOString() });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/donors
  router.get("/", async (req, res, next) => {
    try {
      const { bloodGroup, radius, availableOnly, search, sort } = req.query;

      const where = { isDonor: true, deactivatedAt: null };
      if (bloodGroup && bloodGroup !== "All") {
        const bg = String(bloodGroup).trim().toUpperCase();
        if (!VALID_BLOOD_GROUPS.has(bg)) {
          return res.status(400).json({ error: "Invalid bloodGroup filter." });
        }
        where.bloodGroup = bg;
      }
      if (availableOnly === "true") {
        where.online = true;
        where.available = true;
      }
      if (radius && radius !== "All") {
        const maxKm = Number(radius);
        if (!Number.isFinite(maxKm) || maxKm <= 0 || maxKm > 200) {
          return res.status(400).json({ error: "radius must be between 1 and 200 km." });
        }
        where.distanceKm = { lte: maxKm };
      }
      const cleanSearch = sanitizeText(search, 80);
      if (cleanSearch) {
        where.OR = [
          { name: { contains: cleanSearch } },
          { area: { contains: cleanSearch } },
          { city: { contains: cleanSearch } },
        ];
      }

      const orderBy = { distanceKm: "asc" };

      const donors = await prisma.user.findMany({
        where,
        orderBy,
      });

      return res.json({
        count: donors.length,
        donors: donors.map((d) => sanitizeUser(d, { includePrivate: false })),
      });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/donors/:id
  router.get("/:id", async (req, res, next) => {
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
      return res.json({ donor: sanitizeUser(donor, { includePrivate: false }) });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createDonorsRouter;
