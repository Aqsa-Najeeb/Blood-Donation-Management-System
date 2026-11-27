"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb } = require("./helpers");
const { setNow } = require("../backend/utils/clock");
const { notify } = require("../backend/modules/notifications");

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
  await resetTestDb(prisma);
  setNow(new Date("2026-11-27T10:00:00+05:00"));
});

after(async () => {
  setNow(null);
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

async function registerUser(overrides = {}) {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const res = await request(app).post("/api/auth/register").send({
    name: "C1 User",
    email: `c1_${suffix}@test.com`,
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

describe("Slice C1 — Notification allow-list, deduplication & unread-only scoping (FR-09, ADR-08, ADR-10)", () => {
  it("rejects disallowed notification types (e.g. chat types) and stores duplicates only once", async () => {
    const u = await registerUser();

    await assert.rejects(
      () => notify(u.user.id, { type: "CHAT_MESSAGE", title: "Chat", text: "New message" }),
      /Invalid notification type/i
    );
    await assert.rejects(
      () => notify(u.user.id, { type: "RANDOM_TYPE", title: "Other", text: "Hello" }),
      /Invalid notification type/i
    );

    // Repeated notify() with same (userId, type, reference) is stored once
    await notify(u.user.id, {
      type: "REQUEST_MATCH",
      reference: "BR-DUP-1",
      title: "Match 1",
      text: "1 unit needed",
      link: "/requests",
    });
    await notify(u.user.id, {
      type: "REQUEST_MATCH",
      reference: "BR-DUP-1",
      title: "Match 1",
      text: "1 unit needed",
      link: "/requests",
    });

    const rows = await prisma.notification.findMany({ where: { userId: u.user.id } });
    assert.equal(rows.length, 1);
  });

  it("user sees only own unread notifications; marking read clears them and does not affect others", async () => {
    const userA = await registerUser();
    const userB = await registerUser();

    await notify(userA.user.id, {
      type: "REQUEST_MATCH",
      reference: "BR-A1",
      title: "For A",
      text: "Request for A",
    });
    await notify(userB.user.id, {
      type: "REQUEST_MATCH",
      reference: "BR-B1",
      title: "For B",
      text: "Request for B",
    });

    // User A sees only A's notification
    const aGet1 = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userA.token}`);
    assert.equal(aGet1.status, 200);
    assert.equal(aGet1.body.notifications.length, 1);
    assert.equal(aGet1.body.notifications[0].title, "For A");

    // User A marks read -> User A has 0 unread, User B still has 1 unread
    const aRead = await request(app)
      .post("/api/notifications/read")
      .set("Authorization", `Bearer ${userA.token}`);
    assert.equal(aRead.status, 200);

    const aGet2 = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userA.token}`);
    assert.equal(aGet2.status, 200);
    assert.equal(aGet2.body.notifications.length, 0);

    const bGet = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userB.token}`);
    assert.equal(bGet.status, 200);
    assert.equal(bGet.body.notifications.length, 1);
    assert.equal(bGet.body.notifications[0].title, "For B");
  });

  it("B1–B3 end-to-end: create, respond, approve, and cancel create expected notifications for the right users only without contact details", async () => {
    const owner = await registerUser({ bloodGroup: "A-" });
    const donor = await registerAvailableDonor({ name: "Donor Ali", bloodGroup: "O+", phone: "+92 311 9998887" });
    const bystander = await registerUser({ bloodGroup: "B+" });

    // 1. B1 Create request -> donor gets REQUEST_MATCH
    const createRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        bloodGroup: "O+",
        hospital: "Mayo Hospital",
        city: "Lahore",
        area: "Model Town",
        radius: 10,
        requiredDate: "2026-11-27",
        units: 2,
        urgency: "URGENT",
        contactPhone: "+92 300 7654321",
      });
    assert.equal(createRes.status, 201);
    const reqId = createRes.body.request.id;
    const respId = createRes.body.request.responses.find((r) => r.donorId === donor.user.id).id;

    let donorNotifs = await prisma.notification.findMany({ where: { userId: donor.user.id } });
    assert.equal(donorNotifs.length, 1);
    assert.equal(donorNotifs[0].type, "REQUEST_MATCH");
    assert.ok(!donorNotifs[0].description.includes("7654321"));

    // 2. B2 Donor responds ACCEPTED -> owner gets RESPONSE_RECEIVED
    await request(app)
      .patch(`/api/requests/${reqId}/respond`)
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ donorResponse: "ACCEPTED" });

    let ownerNotifs = await prisma.notification.findMany({ where: { userId: owner.user.id } });
    assert.equal(ownerNotifs.length, 1);
    assert.equal(ownerNotifs[0].type, "RESPONSE_RECEIVED");
    assert.ok(!ownerNotifs[0].description.includes("9998887"));

    // 3. B2 Owner approves donor -> donor gets RESPONSE_DECISION
    await request(app)
      .patch(`/api/requests/${reqId}/decide/${respId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ requesterDecision: "APPROVED" });

    donorNotifs = await prisma.notification.findMany({
      where: { userId: donor.user.id },
      orderBy: { id: "asc" },
    });
    assert.equal(donorNotifs.length, 2);
    assert.equal(donorNotifs[1].type, "RESPONSE_DECISION");
    assert.ok(!donorNotifs[1].description.includes("7654321"));

    // 4. B3 Owner cancels request -> donor gets REQUEST_CLOSED
    await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set("Authorization", `Bearer ${owner.token}`);

    donorNotifs = await prisma.notification.findMany({
      where: { userId: donor.user.id },
      orderBy: { id: "asc" },
    });
    assert.equal(donorNotifs.length, 3);
    assert.equal(donorNotifs[2].type, "REQUEST_CLOSED");
    assert.ok(!donorNotifs[2].description.includes("7654321"));

    // Bystander received 0 notifications
    const bystanderNotifs = await prisma.notification.findMany({ where: { userId: bystander.user.id } });
    assert.equal(bystanderNotifs.length, 0);
  });
});
