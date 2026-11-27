const express = require("express");
const cors = require("cors");
const path = require("path");

const { createRateLimiter } = require("./middleware/rateLimit");
const createAuthRouter = require("./routes/auth");
const createDonorsRouter = require("./routes/donors");
const createRequestsRouter = require("./routes/requests");
const createDonorActionsRouter = require("./routes/donorActions");
const createChatsRouter = require("./routes/chats");
const createSettingsRouter = require("./routes/settings");
const { setNotificationPrisma } = require("./modules/notifications");

function createApp(prisma, { skipRateLimiters = false } = {}) {
  setNotificationPrisma(prisma);
  const app = express();
  const srcDir = path.resolve(__dirname, "..", "src");

  app.disable("x-powered-by");

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
    if (!req.path.startsWith("/api")) {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
      );
    }
    next();
  });

  // Restrictive CORS (same-origin + configured origins)
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.has(origin)) {
          return cb(null, true);
        }
        const err = new Error("Origin not allowed by CORS policy.");
        err.status = 403;
        return cb(err);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Strict payload size limits
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));

  // Scoped rate limiters per app instance (skipped in test mode)
  const apiLimiter = skipRateLimiters ? null : createRateLimiter({
    windowMs: 60_000,
    max: 180,
    message: "API rate limit exceeded. Please slow down.",
  });
  const authLimiter = skipRateLimiters ? null : createRateLimiter({
    windowMs: 15 * 60_000,
    max: 25,
    message: "Too many authentication attempts. Please try again later.",
  });
  const requestLimiter = skipRateLimiters ? null : createRateLimiter({
    windowMs: 5 * 60_000,
    max: 10,
    keyGenerator: (req) => `req:${req.user?.id || req.ip}`,
    message: "Emergency request rate limit exceeded. Please wait before creating another request.",
  });
  const reportLimiter = skipRateLimiters ? null : createRateLimiter({
    windowMs: 15 * 60_000,
    max: 15,
    keyGenerator: (req) => `rep:${req.user?.id || req.ip}`,
    message: "Too many safety reports submitted. Please try again later.",
  });
  const newsletterLimiter = skipRateLimiters ? null : createRateLimiter({
    windowMs: 15 * 60_000,
    max: 10,
    message: "Too many subscription attempts.",
  });

  if (apiLimiter) app.use("/api", apiLimiter);

  // Health Check (no internal error leakage)
  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({
        status: "ok",
        database: "mysql-connected",
        timestamp: new Date().toISOString(),
      });
    } catch {
      return res.status(503).json({
        status: "degraded",
        database: "mysql-disconnected",
      });
    }
  });

  // REST API Routes
  app.use("/api/auth", createAuthRouter(prisma, { authLimiter }));
  app.use("/api/donors", createDonorsRouter(prisma));
  app.use("/api/requests", createRequestsRouter(prisma, { requestLimiter }));
  app.use("/api/donor", createDonorActionsRouter(prisma));
  app.use("/api/chats", createChatsRouter(prisma));
  app.use("/api", createSettingsRouter(prisma, { reportLimiter, newsletterLimiter }));

  // API 404 handler
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  // Serve Frontend static files
  app.use(express.static(srcDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(srcDir, "index.html"));
  });

  // Global error handler (no stack trace or internal error disclosure)
  app.use((err, _req, res, _next) => {
    if (err.type === "entity.too.large") {
      return res.status(413).json({ error: "Request payload too large." });
    }
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ error: "Malformed JSON request body." });
    }
    const status = err.status || 500;
    if (status >= 500) {
      console.error("[API Error]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
    return res.status(status).json({ error: err.message || "Request error." });
  });

  return app;
}

module.exports = createApp;
