"use strict";

const prisma = require("../backend/prisma");
const createApp = require("../backend/app");

const app = createApp(prisma);

module.exports = (req, res) => {
  return app(req, res);
};
