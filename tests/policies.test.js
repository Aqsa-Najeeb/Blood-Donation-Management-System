"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const request = require("supertest");
const { getTestPrisma, resetTestDb, createTestUser, loginTestUser } = require("./helpers");
const createApp = require("../backend/app");
const { setNow } = require("../backend/utils/clock");
const { CURRENT_AGREEMENT_VERSION, MIN_AGE_YEARS } = require("../backend/config/policies");

const prisma = getTestPrisma();
const app = createApp(prisma, { skipRateLimiters: true });

const BASE_NOW = new Date("2026-11-27T12:00:00Z");

function validSignup(overrides = {}) {
  const rand = Math.floor(Math.random() * 100000);
  return {
    name: "Policy Test User",
    username: `policyuser_${Date.now()}_${rand}`,
    password: "Password123",
    phone: "+92 300 1234567",
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
    dateOfBirth: "1998-06-15",
    agreementAccepted: true,
    ...overrides,
  };
}

before(async () => {
  await resetTestDb(prisma);
});

after(async () => {
  setNow(null);
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

beforeEach(async () => {
  setNow(BASE_NOW);
  await resetTestDb(prisma);
});

describe("User Agreement, Age Verification & Policies", () => {
  it("rejects signup without accepting the User Agreement", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validSignup({ agreementAccepted: false }));
    assert.equal(res.status, 400);
    assert.match(res.body.error, /agreement/i);
  });

  it("calculates age automatically from dateOfBirth and refuses access below 18 (BVA: 17y364d rejected, 18y0d accepted)", async () => {
    // At 2026-11-27: 2008-11-28 is 17y 364d -> rejected without needing an ageConfirmed checkbox
    const tooYoung = await request(app)
      .post("/api/auth/register")
      .send(validSignup({ dateOfBirth: "2008-11-28", ageConfirmed: undefined }));
    assert.equal(tooYoung.status, 400);
    assert.match(tooYoung.body.error, new RegExp(String(MIN_AGE_YEARS)));

    // 2008-11-27 is exactly 18y 0d -> accepted automatically
    const exactMin = await request(app)
      .post("/api/auth/register")
      .send(validSignup({ dateOfBirth: "2008-11-27", ageConfirmed: undefined }));
    assert.equal(exactMin.status, 201);
    assert.equal(exactMin.body.user.agreementAccepted, true);
    assert.equal(exactMin.body.user.agreementVersion, CURRENT_AGREEMENT_VERSION);
    assert.equal(exactMin.body.user.ageVerified, true);
    assert.ok(exactMin.body.user.agreementAcceptedAt);
    assert.ok(exactMin.body.user.ageVerifiedAt);
    assert.equal(exactMin.body.user.dateOfBirth, undefined);
  });

  it("rejects invalid, future, or missing dateOfBirth", async () => {
    for (const badDob of [undefined, "", "not-a-date", "2000-02-30", "2030-01-01"]) {
      const payload = validSignup();
      if (badDob === undefined) delete payload.dateOfBirth;
      else payload.dateOfBirth = badDob;
      const res = await request(app).post("/api/auth/register").send(payload);
      assert.equal(res.status, 400);
    }
  });

  it("allows signup without email using username and supports username login", async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send(validSignup({ username: "ali.raza" }));
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.user.email, null);
    assert.equal(regRes.body.user.username, "ali.raza");

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "ali.raza", password: "Password123" });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);
  });

  it("allows legacy/existing accounts (with email or without agreementAccepted) to log in and re-accept agreement", async () => {
    const legacy = await createTestUser(prisma, {
      email: "legacy@example.com",
      username: "legacy.user",
      agreementAccepted: false,
      ageVerified: false,
    });

    const emailLogin = await loginTestUser(app, legacy.email, "Test1234");
    assert.equal(emailLogin.status, 200);

    const userLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: "legacy.user", password: "Test1234" });
    assert.equal(userLogin.status, 200);

    const acceptRes = await request(app)
      .post("/api/auth/accept-agreement")
      .set("Authorization", `Bearer ${userLogin.body.token}`)
      .send({ agreementAccepted: true });
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.body.user.agreementAccepted, true);
    assert.equal(acceptRes.body.user.agreementVersion, CURRENT_AGREEMENT_VERSION);
  });

  it("blocks direct API tampering with agreement or age verification fields via PUT /api/settings", async () => {
    const regRes = await request(app).post("/api/auth/register").send(validSignup());
    const token = regRes.body.token;

    for (const field of [
      { agreementAccepted: false },
      { agreementVersion: "9.9" },
      { agreementAcceptedAt: "2020-01-01T00:00:00Z" },
      { ageVerified: false },
      { ageVerifiedAt: "2020-01-01T00:00:00Z" },
      { dateOfBirth: "1990-01-01" },
    ]) {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(field);
      assert.equal(res.status, 403);
    }
  });

  it("exposes public policy routes and signup checkboxes in frontend without requiring login", () => {
    const mainJs = fs.readFileSync(path.join(__dirname, "..", "src", "js", "main.js"), "utf8");
    const policiesJs = fs.readFileSync(path.join(__dirname, "..", "src", "js", "pages-policies.js"), "utf8");
    const accountJs = fs.readFileSync(path.join(__dirname, "..", "src", "js", "pages-account.js"), "utf8");
    const componentsJs = fs.readFileSync(path.join(__dirname, "..", "src", "js", "components.js"), "utf8");

    const routes = [
      "/user-agreement",
      "/privacy-policy",
      "/terms-of-use",
      "/community-guidelines",
      "/emergency-request-policy",
      "/donor-safety-policy",
      "/moderation-policy",
      "/disclaimer",
    ];
    for (const r of routes) {
      assert.ok(mainJs.includes(`case "${r}":`), `Missing route in main.js: ${r}`);
      assert.ok(policiesJs.includes(r), `Missing policy nav entry: ${r}`);
      assert.ok(componentsJs.includes(r), `Missing footer link: ${r}`);
    }

    assert.ok(!accountJs.includes("ageConfirmed"));
    assert.ok(accountJs.includes("agreementAccepted"));
    assert.ok(accountJs.includes('type="date"'));
    assert.ok(accountJs.includes("LIFE LINK User Agreement"));
  });
});
