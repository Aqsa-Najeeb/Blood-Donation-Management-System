function createRateLimiter({ windowMs = 60_000, max = 60, keyGenerator, message } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 5000) {
      for (const [k, v] of hits.entries()) {
        if (v.resetAt <= now) hits.delete(k);
      }
    }
    const key = keyGenerator ? keyGenerator(req) : req.ip || req.socket?.remoteAddress || "unknown";
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: message || "Too many requests. Please try again later.",
      });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
