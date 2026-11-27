"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb, createTestUser } = require("./helpers");
const { setNow } = require("../backend/utils/clock");

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST || "mysql://root:password@localhost:3306/lifelink_test";
process.env.DATABASE_URL = TEST_DB_URL;

let app;
let prisma;

before(async () => {
  prisma = getTestPrisma();
  app = createApp(prisma, { skipRateLimiters: true });
  await resetTestDb(prisma);
});

beforeEach(async () => {
  setNow(null); // Reset any time overrides
});

after(async () => {
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

// ─── REGISTRATION TESTS ─────────────────────────────────────────────────────

describe("POST /api/auth/register — password BVA", () => {
  it("rejects password of length 7 (too short)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `bva7_${Date.now()}@test.com`,
      password: "Abc123x", // 7 chars
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /8-128/);
  });

  it("accepts password of exactly 8 characters (minimum valid)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `bva8_${Date.now()}@test.com`,
      password: "Abcde1fg", // 8 chars, letter + digit
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
  });

  it("accepts password of exactly 128 characters (maximum valid)", async () => {
    const longPass = "A1" + "b".repeat(126); // 128 chars, has letter + digit
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `bva128_${Date.now()}@test.com`,
      password: longPass,
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
  });

  it("rejects password of length 129 (too long)", async () => {
    const tooLong = "A1" + "b".repeat(127); // 129 chars
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `bva129_${Date.now()}@test.com`,
      password: tooLong,
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /8-128/);
  });

  it("rejects password with no digit", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `nodigit_${Date.now()}@test.com`,
      password: "OnlyLetters",
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /letter.*number|number.*letter/i);
  });

  it("rejects password with no letter", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: `noletter_${Date.now()}@test.com`,
      password: "12345678",
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /letter.*number|number.*letter/i);
  });
});

describe("POST /api/auth/register — required fields", () => {
  const validBase = {
    name: "Test User",
    email: `base_${Date.now()}@test.com`,
    password: "Test1234",
    phone: "+92 300 1234567",
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
  };

  it("rejects when name is missing", async () => {
    const { name, ...body } = { ...validBase, email: `noname_${Date.now()}@test.com` };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects when email is missing", async () => {
    const { email, ...body } = { ...validBase };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects when password is missing", async () => {
    const { password, ...body } = { ...validBase, email: `nopw_${Date.now()}@test.com` };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects when phone is missing", async () => {
    const { phone, ...body } = { ...validBase, email: `nophone_${Date.now()}@test.com` };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects when bloodGroup is missing", async () => {
    const { bloodGroup, ...body } = { ...validBase, email: `nobg_${Date.now()}@test.com` };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects when city is missing", async () => {
    const { city, ...body } = { ...validBase, email: `nocity_${Date.now()}@test.com` };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects when area is missing", async () => {
    const { area, ...body } = { ...validBase, email: `noarea_${Date.now()}@test.com` };
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
  });

  it("rejects invalid email format (no @)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...validBase,
      email: "notanemail",
    });
    assert.equal(res.status, 400);
  });

  it("rejects invalid email format (no domain)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...validBase,
      email: "user@",
    });
    assert.equal(res.status, 400);
  });

  it("rejects invalid blood group", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...validBase,
      email: `badbg_${Date.now()}@test.com`,
      bloodGroup: "Z+",
    });
    assert.equal(res.status, 400);
  });

  it("rejects invalid phone format (too short)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...validBase,
      email: `badphone_${Date.now()}@test.com`,
      phone: "123",
    });
    assert.equal(res.status, 400);
  });

  it("rejects duplicate email", async () => {
    const email = `dup_${Date.now()}@test.com`;
    await request(app).post("/api/auth/register").send({ ...validBase, email });
    const res = await request(app).post("/api/auth/register").send({ ...validBase, email });
    assert.equal(res.status, 409);
    assert.match(res.body.error, /already exists/i);
  });
});

describe("POST /api/auth/register — schema & role rules", () => {
  it("new user has isDonor=false by default", async () => {
    const email = `default_${Date.now()}@test.com`;
    const res = await request(app).post("/api/auth/register").send({
      name: "New User",
      email,
      password: "Test1234",
      phone: "+92 300 1234567",
      bloodGroup: "A+",
      city: "Lahore",
      area: "Model Town",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.isDonor, false);
  });

  it("submitting role=COORDINATOR has no effect", async () => {
    const email = `nocoord_${Date.now()}@test.com`;
    const res = await request(app).post("/api/auth/register").send({
      name: "Coordinator Attempt",
      email,
      password: "Test1234",
      phone: "+92 300 1234567",
      bloodGroup: "B+",
      city: "Lahore",
      area: "Gulberg III",
      role: "COORDINATOR",
    });
    // Should succeed (role is ignored)
    assert.equal(res.status, 201);
    assert.equal(res.body.user.isDonor, false);
    // No coordinator privilege in returned user
    assert.ok(!res.body.user.role || res.body.user.role !== "COORDINATOR");
  });

  it("user response does not expose passwordHash or cnic", async () => {
    const email = `nosensitive_${Date.now()}@test.com`;
    const res = await request(app).post("/api/auth/register").send({
      name: "Safe User",
      email,
      password: "Test1234",
      phone: "+92 300 1234567",
      bloodGroup: "O-",
      city: "Lahore",
      area: "Shadman",
    });
    assert.equal(res.status, 201);
    assert.ok(!res.body.user.passwordHash);
    assert.ok(!res.body.user.cnic);
  });

  it("all 8 blood groups accepted", async () => {
    const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    for (const bg of groups) {
      const res = await request(app).post("/api/auth/register").send({
        name: `BG User ${bg}`,
        email: `bg_${bg.replace("+", "pos").replace("-", "neg")}_${Date.now()}@test.com`,
        password: "Test1234",
        phone: "+92 300 1234567",
        bloodGroup: bg,
        city: "Lahore",
        area: "Model Town",
      });
      assert.equal(res.status, 201, `Expected 201 for blood group ${bg}`);
    }
  });
});

// ─── LOGIN TESTS ─────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  let testEmail;
  const testPassword = "Login1234";

  before(async () => {
    testEmail = `login_${Date.now()}@test.com`;
    await request(app).post("/api/auth/register").send({
      name: "Login Test",
      email: testEmail,
      password: testPassword,
      phone: "+92 300 1234567",
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });
  });

  it("logs in successfully with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.ok(res.body.user);
    assert.equal(res.body.user.email, testEmail);
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "WrongPass1",
    });
    assert.equal(res.status, 401);
    assert.match(res.body.error, /invalid/i);
  });

  it("rejects non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "Test1234",
    });
    assert.equal(res.status, 401);
  });

  it("locks account after 5 consecutive failed login attempts", async () => {
    const lockEmail = `lockme_${Date.now()}@test.com`;
    await request(app).post("/api/auth/register").send({
      name: "Lock Test",
      email: lockEmail,
      password: "Lock1234",
      phone: "+92 300 9999999",
      bloodGroup: "A-",
      city: "Lahore",
      area: "Model Town",
    });

    // 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/login").send({ email: lockEmail, password: "Wrong" + i });
    }

    // 6th attempt should be locked
    const locked = await request(app).post("/api/auth/login").send({
      email: lockEmail,
      password: "Lock1234",
    });
    assert.equal(locked.status, 429);
    assert.match(locked.body.error, /locked|5 consecutive/i);
  });
});

// ─── PROTECTED ROUTE TESTS ───────────────────────────────────────────────────

describe("GET /api/auth/me — auth required", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    assert.equal(res.status, 401);
  });

  it("returns 401 with an invalid / tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer totallyinvalidtoken.abc.xyz");
    assert.equal(res.status, 401);
  });

  it("returns user data with a valid token", async () => {
    const email = `metest_${Date.now()}@test.com`;
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Me Test",
      email,
      password: "Test1234",
      phone: "+92 300 1234567",
      bloodGroup: "B+",
      city: "Lahore",
      area: "Model Town",
    });
    const { token } = regRes.body;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, email);
  });
});

// ─── UTILITY UNIT TESTS ──────────────────────────────────────────────────────

describe("backend/utils/clock.js", () => {
  it("now() returns a Date close to real time by default", () => {
    setNow(null);
    const before = Date.now();
    const { now } = require("../backend/utils/clock");
    const result = now();
    const after = Date.now();
    assert.ok(result instanceof Date);
    assert.ok(result.getTime() >= before - 10 && result.getTime() <= after + 10);
  });

  it("setNow() overrides now() for testing", () => {
    const { now, setNow: sn } = require("../backend/utils/clock");
    const fixed = new Date("2026-01-01T12:00:00Z");
    sn(fixed);
    assert.equal(now().toISOString(), fixed.toISOString());
    sn(null);
  });
});

describe("backend/utils/distance.js", () => {
  it("haversineDistance returns a number for two coordinates", () => {
    const { haversineDistance } = require("../backend/utils/distance");
    const d = haversineDistance(31.4828, 74.3182, 31.5115, 74.3444); // Lahore area
    assert.ok(typeof d === "number");
    assert.ok(d > 0 && d < 50);
  });

  it("haversineDistance is ~0 for the same point", () => {
    const { haversineDistance } = require("../backend/utils/distance");
    const d = haversineDistance(31.4828, 74.3182, 31.4828, 74.3182);
    assert.equal(d, 0);
  });

  it("setDistanceOverride allows injecting a fixed distance", () => {
    const { haversineDistance, setDistanceOverride } = require("../backend/utils/distance");
    setDistanceOverride(99.9);
    const d = haversineDistance(0, 0, 90, 180);
    assert.equal(d, 99.9);
    setDistanceOverride(null);
  });
});

describe("backend/modules/notifications.js", () => {
  it("notify() persists allowed notification types without throwing", async () => {
    const { notify } = require("../backend/modules/notifications");
    const u = await createTestUser(prisma);
    await assert.doesNotReject(() =>
      notify(u.id, { type: "REQUEST_MATCH", reference: "A1-TEST", title: "T", text: "Hello" })
    );
  });
});

describe("backend/modules/restrictions.js stub", () => {
  it("isRestricted() always returns false", async () => {
    const { isRestricted } = require("../backend/modules/restrictions");
    const result = await isRestricted(1);
    assert.equal(result, false);
  });
});
