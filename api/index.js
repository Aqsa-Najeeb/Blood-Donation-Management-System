"use strict";

const prisma = require("../backend/prisma");
const createApp = require("../backend/app");

const app = createApp(prisma);

module.exports = (req, res) => {
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/src")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return app(req, res);
};
