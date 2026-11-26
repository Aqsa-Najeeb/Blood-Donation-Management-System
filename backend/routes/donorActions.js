const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { sanitizeUser, serializeRequest } = require("../utils/serializers");
const { parsePositiveInt, sanitizeText } = require("../utils/validators");
const { now } = require("../utils/clock");

function createDonorActionsRouter(prisma) {
  const router = express.Router();

  // PATCH /api/donor/availability — manual availability toggle (system-managed lastAvailabilityUpdate)
  router.patch("/availability", requireAuth, async (req, res, next) => {
    try {
      const body = req.body || {};
      if (Object.prototype.hasOwnProperty.call(body, "lastAvailabilityUpdate")) {
        return res.status(403).json({ error: "Forbidden: 'lastAvailabilityUpdate' is system-managed." });
      }
      if (typeof body.available !== "boolean") {
        return res.status(400).json({ error: "available must be a boolean." });
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || user.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }
      if (!user.isDonor) {
        return res.status(400).json({ error: "Enable donor mode before changing availability." });
      }

      if (body.available === user.available) {
        return res.json({
          changed: false,
          user: sanitizeUser(user, { includePrivate: true }),
        });
      }

      const currentTime = now();
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          available: body.available,
          lastAvailabilityUpdate: currentTime,
          lastConfirmedAt: currentTime,
          seenLabel: body.available ? "Available Now" : "Unavailable",
        },
      });

      return res.json({
        changed: true,
        user: sanitizeUser(updated, { includePrivate: true }),
      });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/donor/alerts — strictly scoped to authenticated donor
  router.get("/alerts", requireAuth, async (req, res, next) => {
    try {
      const alerts = await prisma.requestResponse.findMany({
        where: { donorId: req.user.id, donorResponse: { in: ["PENDING", "ACCEPTED"] } },
        orderBy: { createdAt: "desc" },
        include: { request: true, donor: true },
      });
      return res.json({
        count: alerts.length,
        alerts: alerts.map((a) => ({
          ...a,
          request: a.request ? serializeRequest(a.request, req.user.id) : undefined,
          donor: a.donor ? sanitizeUser(a.donor, { includePrivate: false }) : undefined,
        })),
      });
    } catch (err) {
      return next(err);
    }
  });

  // Legacy accept/decline endpoints removed — B2 uses PATCH /api/requests/:id/respond

  return router;
}

module.exports = createDonorActionsRouter;
