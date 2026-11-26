"use strict";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST || "mysql://root:password@localhost:3306/lifelink_test";

function getTestPrisma() {
  return new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
}

async function resetTestDb(prisma) {
  await prisma.safetyReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.requestInvitation.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.user.deleteMany();
}

async function createTestUser(prisma, overrides = {}) {
  const defaults = {
    name: "Test User",
    username: `testuser_${Math.floor(Math.random() * 90000 + 10000)}`,
    email: `test${Date.now()}${Math.floor(Math.random() * 999)}@example.com`,
    passwordHash: await bcrypt.hash("Test1234", 10),
    phone: "+92 300 1234567",
    isDonor: false,
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
    shortArea: "Model Town",
    distanceKm: 5.0,
    donorIdCode: `#LL-${Math.floor(1000 + Math.random() * 8999)}`,
    available: false,
    online: true,
    seenLabel: "Available Now",
    replyLabel: "< 15 mins",
    matchingRadiusKm: 10,
    safetyFlags: 0,
    strictPhoneShielding: false,
  };
  return prisma.user.create({ data: { ...defaults, ...overrides } });
}

async function loginTestUser(app, email, password) {
  const request = require("supertest");
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res;
}

module.exports = {
  getTestPrisma,
  resetTestDb,
  createTestUser,
  loginTestUser,
};
