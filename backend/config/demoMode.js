"use strict";

/**
 * Demo Mode is strictly backend-controlled via DEMO_MODE=true
 * and is NEVER allowed when NODE_ENV === "production".
 */
function isDemoModeEnabled() {
  if (String(process.env.NODE_ENV || "").trim().toLowerCase() === "production") {
    return false;
  }
  return String(process.env.DEMO_MODE || "").trim().toLowerCase() === "true";
}

module.exports = {
  isDemoModeEnabled,
};
