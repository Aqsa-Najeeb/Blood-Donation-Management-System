"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb } = require("./helpers");
const { setNow } = require("../backend/utils/clock");
const { setDistanceOverride } = require("../backend/utils/distance");
const { setNotifyHook } = require("../backend/modules/notifications");
const { expireDueRequests, getExpiryAt } = require("../backend/modules/requestLifecycle");

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST || "mysql://root:password@localhost:3306/lifelink_test";
process.env.DATABASE_URL = TEST_DB_URL;

let app;
let prisma;
let notifyCalls = [];

before(async () => {
  prisma = getTestPrisma();
  app = createApp(prisma, { skipRateLimiters: true });
  await resetTestDb(prisma);
});

beforeEach(async () => {
  await resetTestDb(prisma);
  setNow(new Date("2026-11-27T10:00:00+05:00"));
  setDistanceOverride(null);
  notifyCalls = [];
  setNotifyHook((userId, payload) => {
    notifyCalls.push({ userId, ...payload });
  });
});

after(async () => {
  setNow(null);
  setDistanceOverride(null);
  setNotifyHook(null);
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

async function registerUser(overrides = {}) {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const res = await request(app).post("/api/auth/register").send({
    name: "B3 User",
    email: `b3_${suffix}@test.com`,
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

async function registerAvailableDonor(overrides = {}) {
  const created = await registerUser(overrides);
  await prisma.user.update({
    where: { id: created.user.id },
    data: { isDonor: true, available: true },
  });
  return created;
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
  message: "Ward 2",
};

describe("Slice B3 — Expiry BVA & Idempotency (FR-18, BR-11, BR-12, BR-23, D2)", () => {
  it("BVA expiry: 23:58:59 PKT is OPEN; 23:59:00 PKT (18:59:00 UTC) is EXPIRED", async () => {
    // Prove UTC conversion of 23:59:00 PKT
    const expiryUtc = getExpiryAt(new Date("2026-11-27T12:00:00+05:00")).toISOString();
    assert.equal(expiryUtc, "2026-11-27T18:59:00.000Z");

    const owner = await registerUser({ bloodGroup: "A-" });
    const donor = await registerAvailableDonor({ bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    assert.equal(createRes.status, 201);
    const reqId = createRes.body.request.id;

    // 23:58:59 PKT (18:58:59 UTC) -> still OPEN
    setNow(new Date("2026-11-27T18:58:59.000Z"));
    const beforeBoundary = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(beforeBoundary.status, 200);
    assert.equal(beforeBoundary.body.request.status, "OPEN");
    assert.equal(beforeBoundary.body.request.closureReason, null);

    // 23:59:00 PKT (18:59:00 UTC) -> EXPIRED
    notifyCalls = [];
    setNow(new Date("2026-11-27T18:59:00.000Z"));
    const atBoundary = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(atBoundary.status, 200);
    assert.equal(atBoundary.body.request.status, "CLOSED");
    assert.equal(atBoundary.body.request.closureReason, "EXPIRED");

    // Owner and donor notified without contact details
    const ownerNotifs = notifyCalls.filter((c) => c.userId === owner.user.id && c.type === "REQUEST_EXPIRED");
    const donorNotifs = notifyCalls.filter((c) => c.userId === donor.user.id && c.type === "REQUEST_EXPIRED");
    assert.equal(ownerNotifs.length, 1);
    assert.equal(donorNotifs.length, 1);
    for (const c of [...ownerNotifs, ...donorNotifs]) {
      assert.ok(!c.text.includes("7654321"));
    }
  });

  it("running expireDueRequests twice sends notifications only once", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor1 = await registerAvailableDonor({ bloodGroup: "O+" });
    const donor2 = await registerAvailableDonor({ bloodGroup: "O+" });

    await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);

    notifyCalls = [];
    setNow(new Date("2026-11-27T18:59:00.000Z"));

    const firstCount = await expireDueRequests(prisma);
    const secondCount = await expireDueRequests(prisma);

    assert.equal(firstCount, 1);
    assert.equal(secondCount, 0);

    assert.equal(notifyCalls.filter((c) => c.userId === owner.user.id).length, 1);
    assert.equal(notifyCalls.filter((c) => c.userId === donor1.user.id).length, 1);
    assert.equal(notifyCalls.filter((c) => c.userId === donor2.user.id).length, 1);
  });
});

describe("Slice B3 — Cancel, Fulfil & Post-Closure Guards (FR-12, BR-10, D2)", () => {
  it("non-owner cancel gets 403; cancel twice gets 409; cancel after expiry gets 409", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const other = await registerAvailableDonor({ bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;

    // Non-owner cancel -> 403
    const nonOwnerCancel = await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set("Authorization", `Bearer ${other.token}`);
    assert.equal(nonOwnerCancel.status, 403);

    // Owner cancels -> 200 CLOSED / CANCELLED
    notifyCalls = [];
    const cancelRes = await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.request.status, "CLOSED");
    assert.equal(cancelRes.body.request.closureReason, "CANCELLED");

    // Each previously notified donor receives exactly 1 closure notification without contact details
    const donorNotifs = notifyCalls.filter((c) => c.userId === other.user.id && c.type === "REQUEST_CANCELLED");
    assert.equal(donorNotifs.length, 1);
    assert.ok(!donorNotifs[0].text.includes("7654321"));

    // Cancel twice -> 409
    const cancelAgain = await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(cancelAgain.status, 409);

    // Create another request and let it expire -> cancel after expiry -> 409
    const createRes2 = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId2 = createRes2.body.request.id;

    setNow(new Date("2026-11-27T18:59:00.000Z"));
    const cancelAfterExpiry = await request(app)
      .post(`/api/requests/${reqId2}/cancel`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(cancelAfterExpiry.status, 409);
  });

  it("after cancel, donor response change gets 409 and old responses remain readable by owner", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor1 = await registerAvailableDonor({ bloodGroup: "O+" });
    const donor2 = await registerAvailableDonor({ bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;

    // Donor1 accepts before cancel
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor1.token}`)
      .send({ donorResponse: "ACCEPTED" });

    // Owner cancels
    await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set("Authorization", `Bearer ${owner.token}`);

    // Donor response change gets 409
    const respAfterCancel = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor1.token}`)
      .send({ donorResponse: "DECLINED" });
    assert.equal(respAfterCancel.status, 409);

    // Old responses remain readable by owner
    const responsesRes = await request(app)
      .get(`/api/requests/${reqId}/responses`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(responsesRes.status, 200);
    assert.equal(responsesRes.body.responses.length, 2);
    assert.equal(
      responsesRes.body.responses.find((r) => r.donorId === donor1.user.id).donorResponse,
      "ACCEPTED"
    );
    assert.equal(
      responsesRes.body.responses.find((r) => r.donorId === donor2.user.id).donorResponse,
      "PENDING"
    );
  });

  it("owner can mark OPEN request as FULFILLED and notifies each previously notified donor once", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor1 = await registerAvailableDonor({ bloodGroup: "O+" });
    const donor2 = await registerAvailableDonor({ bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;

    // Non-owner fulfil -> 403
    const nonOwnerFulfil = await request(app)
      .post(`/api/requests/${reqId}/fulfil`)
      .set("Authorization", `Bearer ${donor1.token}`);
    assert.equal(nonOwnerFulfil.status, 403);

    notifyCalls = [];
    const fulfilRes = await request(app)
      .post(`/api/requests/${reqId}/fulfil`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(fulfilRes.status, 200);
    assert.equal(fulfilRes.body.request.status, "CLOSED");
    assert.equal(fulfilRes.body.request.closureReason, "FULFILLED");

    // Each notified donor gets exactly 1 notification without contact details
    const d1Notifs = notifyCalls.filter((c) => c.userId === donor1.user.id && c.type === "REQUEST_FULFILLED");
    const d2Notifs = notifyCalls.filter((c) => c.userId === donor2.user.id && c.type === "REQUEST_FULFILLED");
    assert.equal(d1Notifs.length, 1);
    assert.equal(d2Notifs.length, 1);
    assert.ok(!d1Notifs[0].text.includes("7654321"));

    // Fulfil twice -> 409
    const fulfilAgain = await request(app)
      .post(`/api/requests/${reqId}/fulfil`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(fulfilAgain.status, 409);
  });
});
