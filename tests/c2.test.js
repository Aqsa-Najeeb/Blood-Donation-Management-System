"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { getTestPrisma, resetTestDb, createTestUser, loginTestUser } = require("./helpers");
const createApp = require("../backend/app");
const { setNow } = require("../backend/utils/clock");

const prisma = getTestPrisma();
const app = createApp(prisma, { skipRateLimiters: true });

// helper: register+login, return { user, token, agent }
async function registerAndLogin(overrides = {}) {
  const u = await createTestUser(prisma, overrides);
  const loginRes = await loginTestUser(app, u.email, "Test1234");
  return { user: u, token: loginRes.body.token };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => { await resetTestDb(prisma); });
after(async () => { setNow(null); await prisma.$disconnect(); });
beforeEach(async () => { setNow(null); await resetTestDb(prisma); });

// ─────────────────────────────────────────────────────────────────────────────
describe("Slice C2 — Invitation guards", () => {

  it("self-invite is rejected with 400", async () => {
    const { user, token } = await registerAndLogin();
    const res = await request(app)
      .post("/api/chats/invitations")
      .set(auth(token))
      .send({ recipientId: user.id });
    assert.equal(res.status, 400);
  });

  it("invite to deactivated user is rejected with 400", async () => {
    const { token } = await registerAndLogin();
    const target = await createTestUser(prisma, { deactivatedAt: new Date() });
    const res = await request(app)
      .post("/api/chats/invitations")
      .set(auth(token))
      .send({ recipientId: target.id });
    assert.equal(res.status, 400);
  });

  it("second pending invite in the same direction is rejected with 409", async () => {
    const { token } = await registerAndLogin();
    const { user: b } = await registerAndLogin();
    // first invite
    const r1 = await request(app)
      .post("/api/chats/invitations")
      .set(auth(token))
      .send({ recipientId: b.id });
    assert.equal(r1.status, 201);
    // second invite same direction
    const r2 = await request(app)
      .post("/api/chats/invitations")
      .set(auth(token))
      .send({ recipientId: b.id });
    assert.equal(r2.status, 409);
  });

  it("second pending invite in the reverse direction is also rejected with 409", async () => {
    const { user: a, token: tokenA } = await registerAndLogin();
    const { user: b, token: tokenB } = await registerAndLogin();
    // A invites B
    const r1 = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: b.id });
    assert.equal(r1.status, 201);
    // B tries to invite A while A's invite is still pending
    const r2 = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenB))
      .send({ recipientId: a.id });
    assert.equal(r2.status, 409);
  });

  it("BVA reject wait: 23h59m blocked (409), 24h00m allowed (201)", async () => {
    const { user: a, token: tokenA } = await registerAndLogin();
    const { user: b, token: tokenB } = await registerAndLogin();

    // A invites B
    await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: b.id });

    // B rejects — capture the invite id
    const listRes = await request(app)
      .get("/api/chats/invitations")
      .set(auth(tokenB));
    const inv = listRes.body.received[0];
    await request(app)
      .patch(`/api/chats/invitations/${inv.id}`)
      .set(auth(tokenB))
      .send({ action: "REJECT" });

    // Set clock to rejectedAt + 23h59m (still in cooldown)
    const rejectedAt = new Date(
      (await prisma.chatInvitation.findUnique({ where: { id: inv.id } })).rejectedAt
    );
    setNow(new Date(rejectedAt.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000));
    const earlyRes = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: b.id });
    assert.equal(earlyRes.status, 409, "23h59m should still be blocked");

    // Set clock to rejectedAt + 24h00m (cooldown elapsed)
    setNow(new Date(rejectedAt.getTime() + 24 * 60 * 60 * 1000));
    const lateRes = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: b.id });
    assert.equal(lateRes.status, 201, "24h00m should be allowed");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Slice C2 — Non-participant access", () => {

  it("non-participant GET history returns 403", async () => {
    const { user: a, token: tokenA } = await registerAndLogin();
    const { user: b, token: tokenB } = await registerAndLogin();
    const { token: tokenC } = await registerAndLogin();

    // A invites B, B accepts — creates a conversation
    await request(app).post("/api/chats/invitations").set(auth(tokenA)).send({ recipientId: b.id });
    const listRes = await request(app).get("/api/chats/invitations").set(auth(tokenB));
    const inv = listRes.body.received[0];
    const acceptRes = await request(app)
      .patch(`/api/chats/invitations/${inv.id}`)
      .set(auth(tokenB))
      .send({ action: "ACCEPT" });
    const convId = acceptRes.body.conversation.id;

    // C (outsider) tries to read history
    const res = await request(app)
      .get(`/api/chats/${convId}`)
      .set(auth(tokenC));
    assert.equal(res.status, 403);
  });

  it("non-participant POST message returns 403", async () => {
    const { user: a, token: tokenA } = await registerAndLogin();
    const { user: b, token: tokenB } = await registerAndLogin();
    const { token: tokenC } = await registerAndLogin();

    await request(app).post("/api/chats/invitations").set(auth(tokenA)).send({ recipientId: b.id });
    const listRes = await request(app).get("/api/chats/invitations").set(auth(tokenB));
    const inv = listRes.body.received[0];
    const acceptRes = await request(app)
      .patch(`/api/chats/invitations/${inv.id}`)
      .set(auth(tokenB))
      .send({ action: "ACCEPT" });
    const convId = acceptRes.body.conversation.id;

    const res = await request(app)
      .post(`/api/chats/${convId}/messages`)
      .set(auth(tokenC))
      .send({ text: "hello" });
    assert.equal(res.status, 403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Slice C2 — Message BVA", () => {

  async function openConversation(tokenA, tokenB, userB) {
    await request(app).post("/api/chats/invitations").set(auth(tokenA)).send({ recipientId: userB.id });
    const listRes = await request(app).get("/api/chats/invitations").set(auth(tokenB));
    const inv = listRes.body.received[0];
    const acceptRes = await request(app)
      .patch(`/api/chats/invitations/${inv.id}`)
      .set(auth(tokenB))
      .send({ action: "ACCEPT" });
    return acceptRes.body.conversation.id;
  }

  it("BVA message length: 0 → 400; 1 → 201; 1000 → 201; 1001 → 400; whitespace-only → 400", async () => {
    const { token: tokenA } = await registerAndLogin();
    const { user: b, token: tokenB } = await registerAndLogin();
    const convId = await openConversation(tokenA, tokenB, b);

    const r0 = await request(app).post(`/api/chats/${convId}/messages`).set(auth(tokenA)).send({ text: "" });
    assert.equal(r0.status, 400, "empty string");

    const r1 = await request(app).post(`/api/chats/${convId}/messages`).set(auth(tokenA)).send({ text: "x" });
    assert.equal(r1.status, 201, "length 1");

    const r1000 = await request(app).post(`/api/chats/${convId}/messages`).set(auth(tokenA)).send({ text: "a".repeat(1000) });
    assert.equal(r1000.status, 201, "length 1000");

    const r1001 = await request(app).post(`/api/chats/${convId}/messages`).set(auth(tokenA)).send({ text: "a".repeat(1001) });
    assert.equal(r1001.status, 400, "length 1001");

    const rws = await request(app).post(`/api/chats/${convId}/messages`).set(auth(tokenA)).send({ text: "   \t\n  " });
    assert.equal(rws.status, 400, "whitespace-only");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Slice C2 — Restriction rules", () => {

  async function setupPair() {
    const { user: a, token: tokenA } = await registerAndLogin();
    const { user: b, token: tokenB } = await registerAndLogin();

    // A invites B, B restricts
    await request(app).post("/api/chats/invitations").set(auth(tokenA)).send({ recipientId: b.id });
    const listRes = await request(app).get("/api/chats/invitations").set(auth(tokenB));
    const inv = listRes.body.received[0];
    const restrictRes = await request(app)
      .patch(`/api/chats/invitations/${inv.id}`)
      .set(auth(tokenB))
      .send({ action: "RESTRICT" });
    const convId = restrictRes.body.conversation.id;
    return { userA: a, tokenA, userB: b, tokenB, invId: inv.id, convId };
  }

  it("restricted pair: messages blocked (409), new invites blocked (409), history readable by both", async () => {
    const { userA, tokenA, tokenB, convId } = await setupPair();

    // Message blocked
    const msgRes = await request(app)
      .post(`/api/chats/${convId}/messages`)
      .set(auth(tokenA))
      .send({ text: "hello" });
    assert.equal(msgRes.status, 409);

    // New invite blocked
    const invRes = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: userA.id }); // tokenA is A; but let's try B inviting A
    // Actually test: A tries to invite B while restricted
    const invRes2 = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: (await prisma.conversation.findUnique({ where: { id: convId } })).userBId });
    assert.equal(invRes2.status, 409, "invite blocked while restricted");

    // History readable by A
    const histA = await request(app).get(`/api/chats/${convId}`).set(auth(tokenA));
    assert.equal(histA.status, 200);

    // History readable by B
    const histB = await request(app).get(`/api/chats/${convId}`).set(auth(tokenB));
    assert.equal(histB.status, 200);
  });

  it("non-restrictor (A) cannot remove B's restriction (403); B (restrictor) can remove it", async () => {
    const { tokenA, tokenB, convId } = await setupPair();

    // A tries to remove — should fail
    const r = await request(app)
      .patch(`/api/chats/${convId}/restrict`)
      .set(auth(tokenA))
      .send({ action: "remove" });
    assert.equal(r.status, 403);

    // B (restrictor) removes
    const r2 = await request(app)
      .patch(`/api/chats/${convId}/restrict`)
      .set(auth(tokenB))
      .send({ action: "remove" });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.conversation.restrictedById, null);
    assert.equal(r2.body.conversation.requiresReinvite, true);
  });

  it("after restriction removed, messaging stays blocked (requiresReinvite); new invite + accept unblocks it", async () => {
    const { userA, userB, tokenA, tokenB, convId } = await setupPair();

    // B removes restriction
    await request(app)
      .patch(`/api/chats/${convId}/restrict`)
      .set(auth(tokenB))
      .send({ action: "remove" });

    // A tries to message — still blocked
    const msgRes = await request(app)
      .post(`/api/chats/${convId}/messages`)
      .set(auth(tokenA))
      .send({ text: "unblocked?" });
    assert.equal(msgRes.status, 409, "messaging still blocked after restriction removal");

    // A sends a new invitation to B
    const invRes = await request(app)
      .post("/api/chats/invitations")
      .set(auth(tokenA))
      .send({ recipientId: userB.id });
    assert.equal(invRes.status, 201, "new invite should succeed after restriction removal");

    // B accepts the new invitation
    const listRes = await request(app).get("/api/chats/invitations").set(auth(tokenB));
    const newInv = listRes.body.received.find((i) => i.status === "PENDING");
    assert.ok(newInv, "pending invite should exist");
    await request(app)
      .patch(`/api/chats/invitations/${newInv.id}`)
      .set(auth(tokenB))
      .send({ action: "ACCEPT" });

    // Now messaging should work
    const msgRes2 = await request(app)
      .post(`/api/chats/${convId}/messages`)
      .set(auth(tokenA))
      .send({ text: "hi again" });
    assert.equal(msgRes2.status, 201, "messaging works after new invite accepted");
  });
});
