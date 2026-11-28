
"use strict";

const prisma = require("../backend/prisma");
const createApp = require("../backend/app");

const app = createApp(prisma);

module.exports = (req, res) => {
  
  const url = new URL(req.url, "http://localhost");
  const originalPath = url.searchParams.get("__vercel_path");

  if (originalPath !== null) {
    const remainingParams = new URLSearchParams(url.searchParams);
    remainingParams.delete("__vercel_path");

    req.url = "/api/" + originalPath.replace(/^\/+/, "");

    const query = remainingParams.toString();
    if (query) {
      req.url += "?" + query;
    }
  }

  return app(req, res);
};
