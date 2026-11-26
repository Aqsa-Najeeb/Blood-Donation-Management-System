"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb, createTestUser } = require("./helpers");
const { setNow } = require("../backend/utils/clock");
const { setDistanceOverride } = require("../backend/utils/distance");
const { setRestrictionOverride } = require("../backend/modules/restrictions");

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
  setNow(new Date("2026-11-27T10:00:00+05:00")); // 2026-11-27 PKT
  setDistanceOverride(null);
  setRestrictionOverride(null);
});

after(async () => {
  setNow(null);
  setDistanceOverride(null);
  setRestrictionOverride(null);
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

async function registerUser(overrides = {}) {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const res = await request(app).post("/api/auth/register").send({
    name: "B1 User",
    email: `b1_${suffix}@test.com`,
    password: "Password123",
    phone: "+92 300 1234567",
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
    ...overrides,
  });
  assert.equal(res.status, 201);
  return { user: res.body.user, token: res.body.token };
}

const VALID_REQ = {
  bloodGroup: "O+",
  hospital: "Mayo Hospital",
  city: "Lahore",
  area: "Model Town",
  radius: 10,
  requiredDate: "2026-11-27",
  units: 2,
  urgency: "URGENT",
  contactPhone: "+92 300 7654321",
  message: "Needed for ward 2",
};

describe("Slice B1 — Validation BVA (requiredDate, units, radius, required fields)", () => {
  it("BVA requiredDate in PKT: yesterday rejected (400), today and tomorrow accepted (201)", async () => {
    const { token } = await registerUser();

    const yesterday = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, requiredDate: "2026-11-26" });
    assert.equal(yesterday.status, 400);

    const today = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, requiredDate: "2026-11-27" });
    assert.equal(today.status, 201);
    assert.equal(today.body.request.status, "OPEN");
    assert.equal(today.body.request.closureReason, null);

    const tomorrow = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, requiredDate: "2026-11-28" });
    assert.equal(tomorrow.status, 201);
  });

  it("BVA units: 0 and 7 rejected (400), 1 and 6 accepted (201)", async () => {
    const { token } = await registerUser();

    const u0 = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, units: 0 });
    assert.equal(u0.status, 400);

    const u7 = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, units: 7 });
    assert.equal(u7.status, 400);

    const u1 = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, units: 1 });
    assert.equal(u1.status, 201);

    const u6 = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, units: 6 });
    assert.equal(u6.status, 201);
  });

  it("rejects radius 7 (400) and rejects each missing required field (400)", async () => {
    const { token } = await registerUser();

    const badRadius = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...VALID_REQ, radius: 7 });
    assert.equal(badRadius.status, 400);

    const requiredFields = [
      "bloodGroup",
      "hospital",
      "city",
      "area",
      "radius",
      "requiredDate",
      "units",
      "urgency",
      "contactPhone",
    ];
    for (const field of requiredFields) {
      const { [field]: _omitted, ...partial } = VALID_REQ;
      const res = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${token}`)
        .send(partial);
      assert.equal(res.status, 400, `Expected 400 when ${field} is missing`);
    }
  });
});

describe("Slice B1 — Active request limit BVA & Restrictions", () => {
  it("BVA active requests: 3rd allowed, 4th rejected, closing one in DB frees a slot", async () => {
    const { token } = await registerUser();

    const r1 = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send(VALID_REQ);
    const r2 = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send(VALID_REQ);
    const r3 = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send(VALID_REQ);
    assert.equal(r1.status, 201);
    assert.equal(r2.status, 201);
    assert.equal(r3.status, 201);

    const r4 = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send(VALID_REQ);
    assert.equal(r4.status, 400);

    // Close one directly in DB
    await prisma.bloodRequest.update({
      where: { id: r1.body.request.id },
      data: { status: "CLOSED", closureReason: "FULFILLED" },
    });

    const r5 = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send(VALID_REQ);
    assert.equal(r5.status, 201);
  });

  it("blocks restricted user (isRestricted = true) with 403 for all 3 urgencies", async () => {
    const { token } = await registerUser();
    setRestrictionOverride(true);

    for (const urgency of ["STANDARD", "URGENT", "EMERGENCY"]) {
      const res = await request(app)
        .post("/api/requests")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...VALID_REQ, urgency });
      assert.equal(res.status, 403, `Expected 403 for urgency ${urgency}`);
    }
  });
});

describe("Slice B1 — Visibility (D4)", () => {
  it("owner and same blood group can view; different blood group gets 404; guest gets 401", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const sameBg = await registerUser({ bloodGroup: "B+" });
    const diffBg = await registerUser({ bloodGroup: "O+" });

    const created = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...VALID_REQ, bloodGroup: "B+" });
    assert.equal(created.status, 201);
    const reqId = created.body.request.id;

    // Guest -> 401
    const guestList = await request(app).get("/api/requests");
    assert.equal(guestList.status, 401);
    const guestDetail = await request(app).get(`/api/requests/${reqId}`);
    assert.equal(guestDetail.status, 401);

    // Owner -> 200
    const ownerDetail = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(ownerDetail.status, 200);

    // Same blood group -> 200 (and visible in list, without contactPhone)
    const sameDetail = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${sameBg.token}`);
    assert.equal(sameDetail.status, 200);
    assert.equal(sameDetail.body.request.contactPhone, undefined);

    const sameList = await request(app)
      .get("/api/requests")
      .set("Authorization", `Bearer ${sameBg.token}`);
    assert.ok(sameList.body.requests.some((r) => r.id === reqId));

    // Different blood group -> 404 (and not in list)
    const diffDetail = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${diffBg.token}`);
    assert.equal(diffDetail.status, 404);

    const diffList = await request(app)
      .get("/api/requests")
      .set("Authorization", `Bearer ${diffBg.token}`);
    assert.ok(!diffList.body.requests.some((r) => r.id === reqId));
  });
});

describe("Slice B1 — Matching (FR-09, BR-09, BR-18)", () => {
  it("creates PENDING RequestResponse for exact-radius match; excludes outside, Unavailable, owner, and different blood group", async () => {
    const owner = await registerUser({ bloodGroup: "AB+" });
    await prisma.user.update({
      where: { id: owner.user.id },
      data: { isDonor: true, available: true },
    });

    const matchDonor = await createTestUser(prisma, {
      name: "Exact Match Donor",
      isDonor: true,
      available: true,
      bloodGroup: "AB+",
      city: "Lahore",
      area: "Gulberg III", // ~4.1 km from Model Town
    });

    const outsideDonor = await createTestUser(prisma, {
      name: "Outside Donor",
      isDonor: true,
      available: true,
      bloodGroup: "AB+",
      city: "Lahore",
      area: "DHA Phase 5", // ~8.6 km from Model Town
    });

    const unavailableDonor = await createTestUser(prisma, {
      name: "Unavailable Donor",
      isDonor: true,
      available: false,
      bloodGroup: "AB+",
      city: "Lahore",
      area: "Model Town",
    });

    const diffBgDonor = await createTestUser(prisma, {
      name: "Diff BG Donor",
      isDonor: true,
      available: true,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
    });

    // Exact radius 5 km: Gulberg III is ~4.1 km (<= 5), DHA Phase 5 is ~8.6 km (> 5).
    // Also test exact boundary using setDistanceOverride(5) on a single-match check:
    const res = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...VALID_REQ, bloodGroup: "AB+", city: "Lahore", area: "Model Town", radius: 5 });
    assert.equal(res.status, 201);

    const rows = await prisma.requestResponse.findMany({
      where: { requestId: res.body.request.id },
    });
    const matchedIds = rows.map((r) => r.donorId);

    assert.ok(matchedIds.includes(matchDonor.id));
    assert.equal(rows.find((r) => r.donorId === matchDonor.id).donorResponse, "PENDING");
    assert.ok(!matchedIds.includes(outsideDonor.id));
    assert.ok(!matchedIds.includes(unavailableDonor.id));
    assert.ok(!matchedIds.includes(owner.user.id));
    assert.ok(!matchedIds.includes(diffBgDonor.id));

    // Exact boundary test with forced distance = 5 (inclusive) and 5.1 (excluded)
    setDistanceOverride(5);
    const exactRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...VALID_REQ, bloodGroup: "AB+", radius: 5 });
    assert.equal(exactRes.status, 201);
    const exactRows = await prisma.requestResponse.findMany({
      where: { requestId: exactRes.body.request.id },
    });
    assert.ok(exactRows.some((r) => r.donorId === outsideDonor.id && r.donorResponse === "PENDING"));

    setDistanceOverride(5.1);
    const overRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...VALID_REQ, bloodGroup: "AB+", radius: 5 });
    assert.equal(overRes.status, 201);
    const overRows = await prisma.requestResponse.findMany({
      where: { requestId: overRes.body.request.id },
    });
    assert.equal(overRows.length, 0);
  });
});
