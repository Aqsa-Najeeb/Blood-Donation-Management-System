const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

let prisma = globalForPrisma.__lifelinkPrisma;

if (!prisma) {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } catch (err) {
    console.warn("[Prisma Initialization Warning]:", err.message);
    prisma = null;
  }
}

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.__lifelinkPrisma = prisma;
}

module.exports = prisma;
