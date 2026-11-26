"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb, createTestUser, loginTestUser } = require("./helpers");
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

beforeEach(() => {
  setNow(null);
});

after(async () => {
  setNow(null);
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

async function registerAndToken(overrides = {}) {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const payload = {
    name: "Donor User",
    email: `a2_${suffix}@test.com`,
    password: "Password123",
    phone: "+92 300 1234567",
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(payload);
  assert.equal(res.status, 201);
  return { user: res.body.user, token: res.body.token, password: payload.password, email: payload.email };
}

describe("Slice A2 — Donor mode & profile editing (FR-03, BR-07)", () => {
  it("enabling donor mode sets isDonor=true and starts Unavailable (available=false)", async () => {
    const { token } = await registerAndToken();
    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ isDonor: true, available: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.isDonor, true);
    assert.equal(res.body.user.available, false);
  });

  it("rejects blank required profile fields on PUT /api/profile", async () => {
    const { token } = await registerAndToken();
    const base = {
      name: "Valid Name",
      bloodGroup: "A+",
      city: "Lahore",
      area: "Gulberg",
      phone: "+92 300 5551234",
    };

    for (const field of ["name", "bloodGroup", "city", "area", "phone"]) {
      const res = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...base, [field]: "" });
      assert.equal(res.status, 400, `Expected 400 when ${field} is blank`);
    }
  });

  it("rejects invalid phone on profile update", async () => {
    const { token } = await registerAndToken();
    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Valid Name",
        bloodGroup: "A+",
        city: "Lahore",
        area: "Gulberg",
        phone: "123",
      });
    assert.equal(res.status, 400);
  });

  it("rejects invalid blood group on profile update", async () => {
    const { token } = await registerAndToken();
    const res = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Valid Name",
        bloodGroup: "X+",
        city: "Lahore",
        area: "Gulberg",
        phone: "+92 300 5551234",
      });
    assert.equal(res.status, 400);
  });

  it("allows user to edit own profile including declared blood group", async () => {
    const { user, token } = await registerAndToken();
    const res = await request(app)
      .put(`/api/profile/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        bloodGroup: "AB-",
        city: "Lahore",
        area: "Johar Town",
        phone: "+92 321 7654321",
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, "Updated Name");
    assert.equal(res.body.user.bloodGroup, "AB-");
    assert.equal(res.body.user.area, "Johar Town");
  });

  it("returns 403 when User A tries to edit User B profile by id", async () => {
    const userA = await registerAndToken({ email: `usera_${Date.now()}@test.com` });
    const userB = await registerAndToken({ email: `userb_${Date.now()}@test.com` });

    const res = await request(app)
      .put(`/api/profile/${userB.user.id}`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        name: "Hacked Name",
        bloodGroup: "O-",
        city: "Lahore",
        area: "Model Town",
        phone: "+92 300 1112223",
      });
    assert.equal(res.status, 403);
  });

  it("rejects client-supplied lastAvailabilityUpdate with 403", async () => {
    const { token } = await registerAndToken();
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ isDonor: true });

    const r1 = await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Name",
        bloodGroup: "O+",
        city: "Lahore",
        area: "Model Town",
        phone: "+92 300 1234567",
        lastAvailabilityUpdate: "2020-01-01T00:00:00Z",
      });
    assert.equal(r1.status, 403);

    const r2 = await request(app)
      .patch("/api/donor/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ available: true, lastAvailabilityUpdate: "2020-01-01T00:00:00Z" });
    assert.equal(r2.status, 403);
  });
});

describe("Slice A2 — Availability toggle & lastAvailabilityUpdate (FR-04)", () => {
  it("toggling availability updates lastAvailabilityUpdate using clock.now(), and same-status is a no-op", async () => {
    const { token } = await registerAndToken();
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ isDonor: true });

    const t1 = new Date("2026-11-27T10:00:00Z");
    setNow(t1);
    const res1 = await request(app)
      .patch("/api/donor/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ available: true });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.changed, true);
    assert.equal(res1.body.user.available, true);
    assert.equal(new Date(res1.body.user.lastAvailabilityUpdate).toISOString(), t1.toISOString());

    // Setting the same status again (true -> true) is a no-op
    const t2 = new Date("2026-11-27T11:00:00Z");
    setNow(t2);
    const resSame = await request(app)
      .patch("/api/donor/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ available: true });
    assert.equal(resSame.status, 200);
    assert.equal(resSame.body.changed, false);
    assert.equal(new Date(resSame.body.user.lastAvailabilityUpdate).toISOString(), t1.toISOString());

    // Toggling back to false updates lastAvailabilityUpdate to t3
    const t3 = new Date("2026-11-27T12:00:00Z");
    setNow(t3);
    const res2 = await request(app)
      .patch("/api/donor/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ available: false });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.changed, true);
    assert.equal(res2.body.user.available, false);
    assert.equal(new Date(res2.body.user.lastAvailabilityUpdate).toISOString(), t3.toISOString());
  });
});

describe("Slice A2 — Account deletion & anonymisation (D8)", () => {
  it("deactivates and anonymises user, blocks login (401), removes from search, and preserves reports as 'Deleted user'", async () => {
    const target = await registerAndToken({
      name: "Delete Me",
      email: `deleteme_${Date.now()}@test.com`,
    });
    const reporter = await registerAndToken({
      name: "Reporter User",
      email: `reporter_${Date.now()}@test.com`,
    });

    // Enable donor mode and make available so target appears in donor search
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${target.token}`)
      .send({ isDonor: true });
    await request(app)
      .patch("/api/donor/availability")
      .set("Authorization", `Bearer ${target.token}`)
      .send({ available: true });

    // Confirm target is in search before deletion
    const searchBefore = await request(app)
      .get("/api/donors")
      .set("Authorization", `Bearer ${reporter.token}`);
    assert.equal(searchBefore.status, 200);
    assert.ok(searchBefore.body.donors.some((d) => d.id === target.user.id));

    // Create a safety report referencing target
    const repRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetUserId: target.user.id,
        category: "SUSPICIOUS_ACTIVITY",
        reason: "Testing report retention after account deletion.",
      });
    assert.equal(repRes.status, 201);

    // Deactivate account
    const delTime = new Date("2026-11-27T15:30:00Z");
    setNow(delTime);
    const delRes = await request(app)
      .delete("/api/settings/account")
      .set("Authorization", `Bearer ${target.token}`);
    assert.equal(delRes.status, 200);

    // Verify DB anonymisation
    const dbUser = await prisma.user.findUnique({ where: { id: target.user.id } });
    assert.ok(dbUser.deactivatedAt);
    assert.equal(dbUser.name, "Deleted user");
    assert.equal(dbUser.phone, "Deleted");
    assert.notEqual(dbUser.email, target.email);
    assert.equal(dbUser.available, false);

    // Login returns 401
    const loginRes = await request(app).post("/api/auth/login").send({
      email: target.email,
      password: target.password,
    });
    assert.equal(loginRes.status, 401);

    // Excluded from search and donor detail
    const searchAfter = await request(app)
      .get("/api/donors")
      .set("Authorization", `Bearer ${reporter.token}`);
    assert.equal(searchAfter.status, 200);
    assert.ok(!searchAfter.body.donors.some((d) => d.id === target.user.id));

    const detailAfter = await request(app)
      .get(`/api/donors/${target.user.id}`)
      .set("Authorization", `Bearer ${reporter.token}`);
    assert.equal(detailAfter.status, 404);

    // Report remains and linked target user shows 'Deleted user'
    const reports = await prisma.safetyReport.findMany({
      where: { targetUserId: target.user.id },
      include: { targetUser: true },
    });
    assert.equal(reports.length, 1);
    assert.equal(reports[0].targetUser.name, "Deleted user");
  });
});
