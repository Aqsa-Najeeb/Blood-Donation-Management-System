const { now } = require("./clock");

const VALID_BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

function sanitizeText(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function parsePositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) && email.length <= 160;
}

function isStrongPassword(password) {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 128) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasLetter && hasDigit;
}

function isValidPhone(phone) {
  if (typeof phone !== "string") return false;
  const clean = phone.trim();
  // Valid phone format: digits with optional +, -, spaces, at least 7 digits, at most 30 chars
  return clean.length >= 7 && clean.length <= 30 && /^[+]?[\d\s-]{7,30}$/.test(clean);
}

function normalizeReportCategory(category) {
  const allowed = new Set([
    "FALSE_DONOR_INFO",
    "HARASSMENT",
    "INAPPROPRIATE_CONTENT",
    "SUSPICIOUS_ACTIVITY",
  ]);
  const c = String(category || "").trim().toUpperCase();
  return allowed.has(c) ? c : null;
}

function isRestrictedActive(user) {
  if (!user || !user.restrictedUntil) return false;
  return new Date(user.restrictedUntil).getTime() > now().getTime();
}

module.exports = {
  VALID_BLOOD_GROUPS,
  sanitizeText,
  parsePositiveInt,
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  normalizeReportCategory,
  isRestrictedActive,
};
