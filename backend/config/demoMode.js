"use strict";

function isDemoModeEnabled() {
  return String(process.env.DEMO_MODE || "").trim().toLowerCase() === "true";
}

module.exports = { isDemoModeEnabled };