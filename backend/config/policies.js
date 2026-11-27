"use strict";

const CURRENT_AGREEMENT_VERSION = process.env.AGREEMENT_VERSION || "1.0";
const MIN_AGE_YEARS = Number.isInteger(Number(process.env.MIN_AGE_YEARS)) && Number(process.env.MIN_AGE_YEARS) > 0
  ? Number(process.env.MIN_AGE_YEARS)
  : 18;

function calculateAgeYears(dobDate, refDate = new Date()) {
  let age = refDate.getUTCFullYear() - dobDate.getUTCFullYear();
  const monthDiff = refDate.getUTCMonth() - dobDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getUTCDate() < dobDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function parseDateOfBirth(input, refDate = new Date()) {
  if (!input || typeof input !== "string") {
    return { error: "Date of birth (YYYY-MM-DD) is required." };
  }
  const raw = input.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    return { error: "Invalid date of birth format. Use YYYY-MM-DD." };
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dobDate = new Date(Date.UTC(y, m - 1, d));
  if (
    dobDate.getUTCFullYear() !== y ||
    dobDate.getUTCMonth() !== m - 1 ||
    dobDate.getUTCDate() !== d
  ) {
    return { error: "Invalid calendar date of birth." };
  }

  const todayUtc = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate()));
  if (dobDate.getTime() > todayUtc.getTime()) {
    return { error: "Date of birth cannot be in the future." };
  }

  const ageYears = calculateAgeYears(dobDate, todayUtc);
  if (ageYears > 120) {
    return { error: "Please enter a valid date of birth." };
  }

  return { dobDate, ageYears };
}

module.exports = {
  CURRENT_AGREEMENT_VERSION,
  MIN_AGE_YEARS,
  calculateAgeYears,
  parseDateOfBirth,
};
