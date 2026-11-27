"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { getTestPrisma, resetTestDb, createTestUser, loginTestUser } = require("./helpers");
const createApp = require("../backend/app");
const { isDemoModeEnabled } = require("../backend/config/demoMode");

const prisma = getTestPrisma();
const app = createApp(prisma, { skipRateLimiters: true });

let savedNodeEnv;
let savedDemoMode;

before(async () => {
  savedNodeEnv = process.env.NODE_ENV;
  savedDemoMode = process.env.DEMO_MODE;
  await resetTestDb(prisma);
});

after(async () => {
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = savedNodeEnv;

  if (savedDemoMode === undefined) delete process.env.DEMO_MODE;
  else process.env.DEMO_MODE = savedDemoMode;

  await prisma.$disconnect();
});

beforeEach(async () => {
  process.env.NODE_ENV = "test";
  delete process.env.DEMO_MODE;
  await resetTestDb(prisma);
});

describe("Secure Demo Mode System", () => {
  it("defaults to disabled and /api/config exposes only { demoMode: false } without secrets", async () => {
    assert.equal(isDemoModeEnabled(), false);

    const res = await request(app).get("/api/config");
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body), ["demoMode"]);
    assert.equal(res.body.demoMode, false);
  });

  it("blocks /api/auth/demo-login and rejects demo tokens when DEMO_MODE is disabled", async () => {
    process.env.DEMO_MODE = "true";
    const loginRes = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(loginRes.status, 200);
    const demoToken = loginRes.body.token;

    // Disable Demo Mode
    process.env.DEMO_MODE = "false";
    assert.equal(isDemoModeEnabled(), false);

    const disabledLogin = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(disabledLogin.status, 403);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${demoToken}`);
    assert.equal(meRes.status, 401);
  });

  it("never enables Demo Mode in production even when DEMO_MODE=true", async () => {
    process.env.NODE_ENV = "test";
    process.env.DEMO_MODE = "true";
    const loginRes = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(loginRes.status, 200);
    const demoToken = loginRes.body.token;

    // Switch to production with DEMO_MODE=true
    process.env.NODE_ENV = "production";
    process.env.DEMO_MODE = "true";

    assert.equal(isDemoModeEnabled(), false);

    const cfgRes = await request(app).get("/api/config");
    assert.equal(cfgRes.status, 200);
    assert.equal(cfgRes.body.demoMode, false);

    const demoLoginRes = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(demoLoginRes.status, 403);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${demoToken}`);
    assert.equal(meRes.status, 401);
  });

  it("provides isolated demo accounts & data without modifying real DB records", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEMO_MODE = "true";
    assert.equal(isDemoModeEnabled(), true);

    const cfgRes = await request(app).get("/api/config");
    assert.equal(cfgRes.status, 200);
    assert.equal(cfgRes.body.demoMode, true);

    const loginRes = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.demoMode, true);
    assert.equal(loginRes.body.user.email, "demo.donor@lifelink.demo");

    const decoded = jwt.decode(loginRes.body.token);
    assert.equal(decoded.isDemo, true);

    const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

    const meRes = await request(app).get("/api/auth/me").set(authHeader);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, "demo.donor@lifelink.demo");

    const reqRes = await request(app).post("/api/requests").set(authHeader).send({
      bloodGroup: "O+",
      hospital: "Demo Test Hospital",
      city: "Lahore",
      area: "Gulberg",
      units: 1,
      urgency: "URGENT",
      requiredDate: "2026-12-01",
    });
    assert.equal(reqRes.status, 201);

    const profRes = await request(app).put("/api/profile").set(authHeader).send({
      name: "Modified Demo Name",
    });
    assert.equal(profRes.status, 200);

    const repRes = await request(app).post("/api/reports").set(authHeader).send({
      targetUserId: 900002,
      category: "SUSPICIOUS_ACTIVITY",
      reason: "Testing isolated demo safety report",
    });
    assert.equal(repRes.status, 201);

    // Verify real database tables remain completely untouched
    const [realUsers, realRequests, realReports] = await Promise.all([
      prisma.user.count(),
      prisma.bloodRequest.count(),
      prisma.safetyReport.count(),
    ]);
    assert.equal(realUsers, 0);
    assert.equal(realRequests, 0);
    assert.equal(realReports, 0);
  });

  it("rejects demo emails on the real login endpoint and preserves real user auth", async () => {
    process.env.DEMO_MODE = "true";
    const demoRealLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "demo.donor@lifelink.demo", password: "anypassword" });
    assert.equal(demoRealLogin.status, 401);

    // Real user authentication works normally
    const realUser = await createTestUser(prisma, { email: "real.user@example.com" });
    const realLogin = await loginTestUser(app, realUser.email, "Test1234");
    assert.equal(realLogin.status, 200);
    assert.ok(realLogin.body.token);

    const decoded = jwt.decode(realLogin.body.token);
    assert.equal(decoded.isDemo, false);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${realLogin.body.token}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, "real.user@example.com");
  });

  it("frontend removes offline fallback login and renders service-unavailable & demo banner", () => {
    const storeSrc = fs.readFileSync(path.join(__dirname, "..", "src", "js", "store.js"), "utf8");
    const accountSrc = fs.readFileSync(
      path.join(__dirname, "..", "src", "js", "pages-account.js"),
      "utf8"
    );

    assert.ok(storeSrc.includes('apiFetch("/api/config")'));
    assert.ok(storeSrc.includes("service-unavailable-screen"));
    assert.ok(storeSrc.includes("demo-mode-banner"));
    assert.ok(storeSrc.includes('apiFetch("/api/auth/demo-login"'));
    assert.ok(!storeSrc.includes("Fallback smoothly to local seeded state"));
    assert.ok(!accountSrc.includes('loginUser({ username: "Usman Khan"'));
    assert.ok(!accountSrc.includes('loginUser({ username: "Farhan Malik"'));
  });
});
