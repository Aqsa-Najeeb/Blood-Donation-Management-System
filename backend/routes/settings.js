const express = require("express");
const bcrypt = require("bcryptjs");
const { requireAuth } = require("../middleware/auth");
const { sanitizeUser } = require("../utils/serializers");
const { now } = require("../utils/clock");
const {
  VALID_BLOOD_GROUPS,
  sanitizeText,
  parsePositiveInt,
  isValidEmail,
  isStrongPassword,
  normalizeReportCategory,
} = require("../utils/validators");

const PROTECTED_USER_FIELDS = [
  "id",
  "safetyFlags",
  "restrictedUntil",
  "donorIdCode",
  "passwordHash",
];

const REPORT_THRESHOLD = 3;
const RESTRICTION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function createSettingsRouter(prisma, { reportLimiter } = {}) {
  const router = express.Router();

  // PUT /api/settings
  router.put("/settings", requireAuth, async (req, res, next) => {
    try {
      const body = req.body || {};

      for (const field of PROTECTED_USER_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
          return res.status(403).json({ error: `Forbidden: field '${field}' cannot be modified.` });
        }
      }

      const {
        name,
        email,
        phone,
        bloodGroup,
        city,
        area,
        isDonor,
        available,
        strictPhoneShielding,
        matchingRadiusKm,
      } = body;

      const data = {};
      if (name !== undefined) {
        const cleanName = sanitizeText(name, 100);
        if (cleanName.length < 2) {
          return res.status(400).json({ error: "name must be at least 2 characters." });
        }
        data.name = cleanName;
      }
      if (email !== undefined) {
        if (!isValidEmail(email)) {
          return res.status(400).json({ error: "Invalid email format." });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const clash = await prisma.user.findFirst({
          where: { email: normalizedEmail, id: { not: req.user.id } },
        });
        if (clash) {
          return res.status(409).json({ error: "Email is already in use by another account." });
        }
        data.email = normalizedEmail;
      }
      if (phone !== undefined) data.phone = sanitizeText(phone, 30);
      if (bloodGroup !== undefined) {
        const bg = String(bloodGroup).trim().toUpperCase();
        if (!VALID_BLOOD_GROUPS.has(bg)) {
          return res.status(400).json({ error: "Invalid bloodGroup." });
        }
        data.bloodGroup = bg;
      }
      if (city !== undefined) data.city = sanitizeText(city, 80);
      if (area !== undefined) data.area = sanitizeText(area, 160);
      if (isDonor !== undefined) data.isDonor = Boolean(isDonor);
      if (available !== undefined) data.available = Boolean(available);
      if (strictPhoneShielding !== undefined) data.strictPhoneShielding = Boolean(strictPhoneShielding);
      if (matchingRadiusKm !== undefined) {
        const r = Number(matchingRadiusKm);
        if (!Number.isFinite(r) || r < 5 || r > 50) {
          return res.status(400).json({ error: "matchingRadiusKm must be between 5 and 50." });
        }
        data.matchingRadiusKm = Math.round(r);
      }
      data.lastConfirmedAt = now();

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data,
      });

      return res.json({
        message: "Settings updated successfully.",
        user: sanitizeUser(updated, { includePrivate: true }),
      });
    } catch (err) {
      return next(err);
    }
  });

  // PUT /api/settings/password
  router.put("/settings/password", requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "currentPassword and newPassword are required." });
      }

      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          error: "newPassword must be 8-128 characters and include at least one letter and one number.",
        });
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const match = await bcrypt.compare(String(currentPassword), user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Incorrect current password." });
      }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash },
      });

      return res.json({ message: "Password updated successfully." });
    } catch (err) {
      return next(err);
    }
  });

  // DELETE /api/settings/account
  router.delete("/settings/account", requireAuth, async (req, res, next) => {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { available: false, online: false, seenLabel: "Deactivated" },
      });
      return res.json({ message: "Account deactivated and hidden from public donor discovery." });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/notifications
  router.get("/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      });
      return res.json({ notifications });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/notifications/read
  router.post("/notifications/read", requireAuth, async (req, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.id },
        data: { unread: false },
      });
      return res.json({ message: "Notifications marked as read." });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/reports
  router.post("/reports", requireAuth, ...(reportLimiter ? [reportLimiter] : []), async (req, res, next) => {
    try {
      const body = req.body || {};

      for (const forbidden of ["safetyFlags", "restrictedUntil", "duration", "durationDays", "count", "reporterId"]) {
        if (Object.prototype.hasOwnProperty.call(body, forbidden)) {
          return res.status(403).json({ error: `Forbidden: '${forbidden}' cannot be supplied by client.` });
        }
      }

      const targetId = parsePositiveInt(body.targetUserId);
      if (!targetId) {
        return res.status(400).json({ error: "Valid targetUserId is required." });
      }
      if (targetId === req.user.id) {
        return res.status(400).json({ error: "You cannot report your own account." });
      }

      const category = normalizeReportCategory(body.category || "SUSPICIOUS_ACTIVITY");
      if (!category) {
        return res.status(400).json({
          error:
            "Invalid report category. Allowed: FALSE_DONOR_INFO, HARASSMENT, INAPPROPRIATE_CONTENT, SUSPICIOUS_ACTIVITY.",
        });
      }

      const cleanReason = sanitizeText(body.reason, 1000);
      if (cleanReason.length < 10) {
        return res.status(400).json({
          error: "Evidence-based report requires a detailed reason of at least 10 characters.",
        });
      }
      const cleanEvidence = body.evidence ? sanitizeText(body.evidence, 1000) : null;

      const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
      if (!targetUser) {
        return res.status(404).json({ error: "Reported user not found." });
      }

      const existingReport = await prisma.safetyReport.findFirst({
        where: { targetUserId: targetId, reporterId: req.user.id },
      });
      if (existingReport) {
        return res.status(409).json({
          error: "You have already reported this account. Duplicate reports from the same user are not counted.",
        });
      }

      await prisma.safetyReport.create({
        data: {
          targetUserId: targetId,
          reporterId: req.user.id,
          category,
          reason: cleanReason,
          evidence: cleanEvidence,
        },
      });

      const independentCount = await prisma.safetyReport.count({
        where: { targetUserId: targetId },
      });

      const thresholdReached = independentCount >= REPORT_THRESHOLD;
      const newRestrictedUntil = thresholdReached
        ? new Date(now().getTime() + RESTRICTION_DURATION_MS)
        : targetUser.restrictedUntil;

      await prisma.user.update({
        where: { id: targetId },
        data: {
          safetyFlags: independentCount,
          ...(thresholdReached && (!targetUser.restrictedUntil || new Date(targetUser.restrictedUntil) <= now())
            ? { restrictedUntil: newRestrictedUntil }
            : {}),
        },
      });

      return res.status(201).json({
        category,
        safetyFlags: independentCount,
        autoRestricted: thresholdReached,
        restrictionScope: thresholdReached ? "NEW_EMERGENCY_REQUESTS_7_DAYS" : null,
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createSettingsRouter;
