const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { signToken, requireAuth, extractBearer, revokeToken } = require("../middleware/auth");
const { isDemoEmail } = require("../modules/demoStore");
const { sanitizeUser } = require("../utils/serializers");
const { now } = require("../utils/clock");
const {
  CURRENT_AGREEMENT_VERSION,
  MIN_AGE_YEARS,
  parseDateOfBirth,
} = require("../config/policies");
const {
  VALID_BLOOD_GROUPS,
  sanitizeText,
  isValidEmail,
  isStrongPassword,
  isValidPhone,
} = require("../utils/validators");

function createAuthRouter(prisma, { authLimiter } = {}) {
  const router = express.Router();
  const failedAttempts = new Map();
  const MAX_FAILED = 5;
  const LOCK_MS = 15 * 60 * 1000;

  function checkAccountLock(key) {
    const entry = failedAttempts.get(key);
    if (!entry) return false;
    const currentTime = now().getTime();
    if (entry.lockUntil && entry.lockUntil > currentTime) return true;
    if (entry.resetAt <= currentTime) {
      failedAttempts.delete(key);
      return false;
    }
    return false;
  }

  function recordFailure(key) {
    const currentTime = now().getTime();
    const entry = failedAttempts.get(key);
    if (!entry || entry.resetAt <= currentTime) {
      failedAttempts.set(key, { count: 1, resetAt: currentTime + LOCK_MS, lockUntil: null });
      return;
    }
    entry.count += 1;
    if (entry.count >= MAX_FAILED) {
      entry.lockUntil = currentTime + LOCK_MS;
    }
  }

  function resetFailures(key) {
    failedAttempts.delete(key);
  }

  // POST /api/auth/register
  router.post("/register", ...(authLimiter ? [authLimiter] : []), async (req, res, next) => {
    try {
      const {
        name,
        email,
        username,
        password,
        phone,
        bloodGroup,
        city,
        area,
        dateOfBirth,
        ageConfirmed,
        agreementAccepted,
      } = req.body || {};

      const cleanName = sanitizeText(name, 100);
      if (cleanName.length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters." });
      }

      if (agreementAccepted !== true) {
        return res.status(400).json({
          error: "You must read and agree to the LIFE LINK User Agreement before registering.",
        });
      }

      if (ageConfirmed !== true) {
        return res.status(400).json({
          error: `You must confirm that you meet the minimum age requirement (${MIN_AGE_YEARS}+).`,
        });
      }

      const currentNow = now();
      const dobCheck = parseDateOfBirth(dateOfBirth, currentNow);
      if (dobCheck.error) {
        return res.status(400).json({ error: dobCheck.error });
      }
      if (dobCheck.ageYears < MIN_AGE_YEARS) {
        return res.status(400).json({
          error: `You must be at least ${MIN_AGE_YEARS} years old to register on LIFE LINK.`,
        });
      }

      let normalizedEmail = null;
      if (email !== undefined && email !== null && String(email).trim() !== "") {
        if (!isValidEmail(email)) {
          return res.status(400).json({ error: "Please provide a valid email address." });
        }
        normalizedEmail = String(email).trim().toLowerCase();
      }

      if (!password || !isStrongPassword(password)) {
        return res.status(400).json({
          error: "Password must be 8-128 characters and include at least one letter and one number.",
        });
      }

      if (!phone || !isValidPhone(phone)) {
        return res.status(400).json({ error: "A valid contact phone number is required." });
      }

      if (!bloodGroup) {
        return res.status(400).json({ error: "Blood group is required." });
      }

      const bg = String(bloodGroup).trim().toUpperCase();
      if (!VALID_BLOOD_GROUPS.has(bg)) {
        return res.status(400).json({ error: "Invalid bloodGroup value." });
      }

      const cleanCity = sanitizeText(city, 80);
      if (!cleanCity || cleanCity.length < 2) {
        return res.status(400).json({ error: "City is required." });
      }

      const cleanArea = sanitizeText(area, 160);
      if (!cleanArea || cleanArea.length < 2) {
        return res.status(400).json({ error: "Area is required." });
      }

      const baseHandle = normalizedEmail
        ? normalizedEmail.split("@")[0].replace(/[^a-z0-9._-]/g, "")
        : cleanName.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 20) || "user";
      const rawUser = username
        ? sanitizeText(username, 60).toLowerCase().replace(/[^a-z0-9._-]/g, "")
        : `${baseHandle}_${crypto.randomBytes(2).toString("hex")}`;

      if (rawUser.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 alphanumeric characters." });
      }

      const clashConditions = [{ username: rawUser }];
      if (normalizedEmail) clashConditions.push({ email: normalizedEmail });
      const existing = await prisma.user.findFirst({
        where: { OR: clashConditions },
      });
      if (existing) {
        return res.status(409).json({ error: "An account with this username or email already exists." });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);

      // Single account model: isDonor defaults to false, no coordinator role
      const created = await prisma.user.create({
        data: {
          name: cleanName,
          username: rawUser,
          email: normalizedEmail,
          passwordHash,
          phone: sanitizeText(phone, 30),
          isDonor: false,
          bloodGroup: bg,
          city: cleanCity,
          area: cleanArea,
          shortArea: cleanCity.split(",")[0].trim() || "Lahore",
          donorIdCode: `#LL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
          available: false,
          online: true,
          seenLabel: "Available Now",
          replyLabel: "< 15 mins",
          agreementAccepted: true,
          agreementVersion: CURRENT_AGREEMENT_VERSION,
          agreementAcceptedAt: currentNow,
          ageVerified: true,
          ageVerifiedAt: currentNow,
          dateOfBirth: dobCheck.dobDate,
        },
      });

      const token = signToken(created);
      return res.status(201).json({
        token,
        user: sanitizeUser(created, { includePrivate: true }),
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/login — supports username or email identifier
  router.post("/login", ...(authLimiter ? [authLimiter] : []), async (req, res, next) => {
    try {
      const { identifier, username, email, password } = req.body || {};
      const cleanId = String(identifier || username || email || "").trim().toLowerCase();
      if (!cleanId || !password) {
        return res.status(400).json({ error: "Username/email and password are required." });
      }
      if (isDemoEmail(cleanId)) {
        return res.status(401).json({ error: "Demo accounts cannot authenticate against real database accounts." });
      }

      const lockKey = `login:${cleanId}`;
      if (checkAccountLock(lockKey)) {
        return res.status(429).json({
          error: "Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.",
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: cleanId }, { username: cleanId }],
        },
      });

      if (!user) {
        recordFailure(lockKey);
        return res.status(401).json({ error: "Invalid credentials." });
      }

      if (user.deactivatedAt) {
        return res.status(401).json({ error: "This account has been deactivated." });
      }

      const match = await bcrypt.compare(String(password), user.passwordHash);
      if (!match) {
        recordFailure(lockKey);
        return res.status(401).json({ error: "Invalid credentials." });
      }

      resetFailures(lockKey);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastConfirmedAt: now(), online: true },
      });

      const token = signToken(user);
      return res.json({
        token,
        user: sanitizeUser(user, { includePrivate: true }),
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/accept-agreement — re-accept latest User Agreement version
  router.post("/accept-agreement", requireAuth, async (req, res, next) => {
    try {
      if (req.body?.agreementAccepted !== true) {
        return res.status(400).json({ error: "You must accept the User Agreement." });
      }
      const current = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!current || current.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          agreementAccepted: true,
          agreementVersion: CURRENT_AGREEMENT_VERSION,
          agreementAcceptedAt: now(),
        },
      });
      return res.json({ user: sanitizeUser(updated, { includePrivate: true }) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/logout — revoke current bearer token
  router.post("/logout", requireAuth, (req, res) => {
    const token = extractBearer(req);
    if (token) revokeToken(token);
    return res.json({ message: "Logged out successfully." });
  });

  // GET /api/auth/me
  router.get("/me", requireAuth, async (req, res, next) => {
    try {
      const fresh = await prisma.user.findUnique({
        where: { id: req.user.id },
      });
      if (!fresh || fresh.deactivatedAt) {
        return res.status(401).json({ error: "Account not found or deactivated." });
      }
      return res.json({ user: sanitizeUser(fresh, { includePrivate: true }) });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createAuthRouter;
