"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb } = require("./helpers");
const { setNow } = require("../backend/utils/clock");
const { setDistanceOverride } = require("../backend/utils/distance");
const { setNotifyHook } = require("../backend/modules/notifications");

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
    name: "B2 User",
    email: `b2_${suffix}@test.com`,
    password: "Password123",
    phone: "+92 300 1234567",
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
    dateOfBirth: "1995-05-15",
    ageConfirmed: true,
    agreementAccepted: true,
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

describe("Slice B2 — Donor responses & guards", () => {
  it("non-notified donor gets 403; responding to closed request gets 409", async () => {
    const owner = await registerUser({ bloodGroup: "A+" });
    const notifiedDonor = await registerAvailableDonor({ bloodGroup: "O+", area: "Model Town" });
    const unnotifiedDonor = await registerAvailableDonor({ bloodGroup: "O+", area: "Model Town" });

    // Remove unnotifiedDonor's availability before creating request so they are not notified
    await prisma.user.update({
      where: { id: unnotifiedDonor.user.id },
      data: { available: false },
    });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    assert.equal(createRes.status, 201);
    const reqId = createRes.body.request.id;

    // Non-notified donor -> 403
    const unnotifiedRes = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${unnotifiedDonor.token}`)
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(unnotifiedRes.status, 403);

    // Close the request directly in DB -> responding gets 409
    await prisma.bloodRequest.update({
      where: { id: reqId },
      data: { status: "CLOSED", closureReason: "CANCELLED" },
    });

    const closedRes = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${notifiedDonor.token}`)
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(closedRes.status, 409);
  });

  it("allows changing response ACCEPTED -> DECLINED -> ACCEPTED while OPEN and notifies requester", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor = await registerAvailableDonor({ name: "Ali Donor", bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;
    notifyCalls = [];

    const r1 = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(r1.status, 200);
    assert.equal(r1.body.request.responses[0].donorResponse, "ACCEPTED");
    assert.ok(notifyCalls.some((c) => c.userId === owner.user.id && c.type === "RESPONSE_RECEIVED"));

    const r2 = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ donorResponse: "DECLINED" });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.request.responses[0].donorResponse, "DECLINED");

    const r3 = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(r3.status, 200);
    assert.equal(r3.body.request.responses[0].donorResponse, "ACCEPTED");
  });
});

describe("Slice B2 — Requester decisions, contact visibility & closed readability", () => {
  it("rejects approving PENDING or DECLINED (400) and rejects non-owner approving (403)", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor = await registerAvailableDonor({ bloodGroup: "O+" });
    const otherUser = await registerUser({ bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;
    const respId = createRes.body.request.responses.find((r) => r.donorId === donor.user.id).id;

    // Approving PENDING -> 400
    const pendingApprove = await request(app)
      .patch(`/api/requests/${reqId}/decide/${respId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ requesterDecision: "APPROVED" });
    assert.equal(pendingApprove.status, 400);

    // Donor declines -> approving DECLINED -> 400
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ donorResponse: "DECLINED" });

    const declinedApprove = await request(app)
      .patch(`/api/requests/${reqId}/decide/${respId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ requesterDecision: "APPROVED" });
    assert.equal(declinedApprove.status, 400);

    // Donor accepts -> non-owner approving -> 403
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ donorResponse: "ACCEPTED" });

    const nonOwnerApprove = await request(app)
      .patch(`/api/requests/${reqId}/decide/${respId}`)
      .set("Authorization", `Bearer ${otherUser.token}`)
      .send({ requesterDecision: "APPROVED" });
    assert.equal(nonOwnerApprove.status, 403);
  });

  it("hides contact before approval, shows after approval, hides from other donors, and hides again if donor switches to DECLINED", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor1 = await registerAvailableDonor({ bloodGroup: "O+" });
    const donor2 = await registerAvailableDonor({ bloodGroup: "O+" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;
    const resp1Id = createRes.body.request.responses.find((r) => r.donorId === donor1.user.id).id;

    // Before approval: donor1 accepts, contactPhone must be absent
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor1.token}`)
      .send({ donorResponse: "ACCEPTED" });

    const beforeDetail = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${donor1.token}`);
    assert.equal(beforeDetail.status, 200);
    assert.equal("contactPhone" in beforeDetail.body.request, false);

    // Owner approves donor1 -> notify called for donor1
    notifyCalls = [];
    const approveRes = await request(app)
      .patch(`/api/requests/${reqId}/decide/${resp1Id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ requesterDecision: "APPROVED" });
    assert.equal(approveRes.status, 200);
    assert.ok(notifyCalls.some((c) => c.userId === donor1.user.id && c.type === "RESPONSE_DECISION"));

    // Donor1 sees contactPhone
    const afterDetail1 = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${donor1.token}`);
    assert.equal(afterDetail1.body.request.contactPhone, VALID_REQ.contactPhone);

    // Donor2 still does NOT see contactPhone
    const afterDetail2 = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${donor2.token}`);
    assert.equal("contactPhone" in afterDetail2.body.request, false);

    // Donor1 switches to DECLINED -> requesterDecision resets to NONE and contactPhone is absent again
    const switchDecline = await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor1.token}`)
      .send({ donorResponse: "DECLINED" });
    assert.equal(switchDecline.status, 200);
    assert.equal(switchDecline.body.request.responses[0].requesterDecision, "NONE");
    assert.equal("contactPhone" in switchDecline.body.request, false);

    const afterDeclineDetail = await request(app)
      .get(`/api/requests/${reqId}`)
      .set("Authorization", `Bearer ${donor1.token}`);
    assert.equal("contactPhone" in afterDeclineDetail.body.request, false);
  });

  it("allows two approved donors at once while request stays OPEN, and responses remain readable by owner after close without donor phones", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor1 = await registerAvailableDonor({ name: "Donor One", bloodGroup: "O+", phone: "+92 301 1111111" });
    const donor2 = await registerAvailableDonor({ name: "Donor Two", bloodGroup: "O+", phone: "+92 302 2222222" });

    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(VALID_REQ);
    const reqId = createRes.body.request.id;
    const resp1Id = createRes.body.request.responses.find((r) => r.donorId === donor1.user.id).id;
    const resp2Id = createRes.body.request.responses.find((r) => r.donorId === donor2.user.id).id;

    // Both accept
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor1.token}`)
      .send({ donorResponse: "ACCEPTED" });
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor2.token}`)
      .send({ donorResponse: "ACCEPTED" });

    // Owner approves both
    const a1 = await request(app)
      .patch(`/api/requests/${reqId}/decide/${resp1Id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ requesterDecision: "APPROVED" });
    assert.equal(a1.status, 200);

    const a2 = await request(app)
      .patch(`/api/requests/${reqId}/decide/${resp2Id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ requesterDecision: "APPROVED" });
    assert.equal(a2.status, 200);
    assert.equal(a2.body.request.status, "OPEN");

    const approvedCount = a2.body.request.responses.filter((r) => r.requesterDecision === "APPROVED").length;
    assert.equal(approvedCount, 2);

    // No donor phone numbers exposed to requester
    for (const r of a2.body.request.responses) {
      assert.equal("phone" in r.donor, false);
    }

    // Close the request directly in DB
    await prisma.bloodRequest.update({
      where: { id: reqId },
      data: { status: "CLOSED", closureReason: "FULFILLED" },
    });

    // Responses stay visible to owner after close
    const closedResponses = await request(app)
      .get(`/api/requests/${reqId}/responses`)
      .set("Authorization", `Bearer ${owner.token}`);
    assert.equal(closedResponses.status, 200);
    assert.equal(closedResponses.body.status, "CLOSED");
    assert.equal(closedResponses.body.responses.length, 2);
    for (const r of closedResponses.body.responses) {
      assert.equal("phone" in r.donor, false);
      assert.ok(r.donor.name);
      assert.ok(r.donor.bloodGroup);
      assert.ok(r.donor.area);
    }
  });
});
