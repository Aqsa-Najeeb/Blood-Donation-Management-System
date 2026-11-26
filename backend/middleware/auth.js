const jwt = require("jsonwebtoken");

const DEV_FALLBACK_SECRET = "lifelink-dev-secret-change-in-production";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || secret === DEV_FALLBACK_SECRET)) {
    throw new Error("JWT_SECRET must be set to a strong 32+ character secret in production.");
  }
  return secret || DEV_FALLBACK_SECRET;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      isDonor: Boolean(user.isDonor),
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "7d" }
  );
}

function extractBearer(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    return token || null;
  }
  return null;
}

function verifyToken(token) {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
  if (!decoded || !Number.isInteger(decoded.id) || decoded.id <= 0) {
    throw new Error("Malformed token payload");
  }
  return decoded;
}

function requireAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required. Missing Bearer token." });
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

function optionalAuth(req, _res, next) {
  const token = extractBearer(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }
  return next();
}

function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!allowed.has(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role permissions." });
    }
    return next();
  };
}

module.exports = {
  signToken,
  requireAuth,
  optionalAuth,
  requireRole,
};
