"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const { getTestPrisma, resetTestDb } = require("./helpers");
const createApp = require("../backend/app");
const { isDemoModeEnabled } = require("../backend/config/demoMode");
const { DEMO_ACCOUNTS } = require("../backend/modules/demoStore");

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
  if (app.resetDemoStore) app.resetDemoStore();
  await resetTestDb(prisma);
});

describe("Pre-Deployment Verification Suite", () => {
  // 4. Test switching between all demo accounts
  it("Requirement 4: Switches cleanly across all demo accounts with proper roles and claims", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEMO_MODE = "true";

    const accountsToTest = [
      { role: "donor", expectedName: "Usman Khan (Demo)", expectedIsDonor: true, expectedBg: "O+" },
      { role: "recipient", expectedName: "Farhan Malik (Demo)", expectedIsDonor: false, expectedBg: "O+" },
      { role: "sample_donor", expectedName: "Ayesha Siddiqui (Demo)", expectedIsDonor: true, expectedBg: "A+" },
      { role: "ayesha", expectedName: "Ayesha Siddiqui (Demo)", expectedIsDonor: true, expectedBg: "A+" },
    ];

    for (const testCase of accountsToTest) {
      const res = await request(app).post("/api/auth/demo-login").send({ role: testCase.role });
      assert.equal(res.status, 200, `Login failed for role ${testCase.role}`);
      assert.equal(res.body.demoMode, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.name, testCase.expectedName);
      assert.equal(res.body.user.isDonor, testCase.expectedIsDonor);
      assert.equal(res.body.user.bloodGroup, testCase.expectedBg);

      const decoded = jwt.decode(res.body.token);
      assert.equal(decoded.isDemo, true);

      // Verify token is accepted on /api/auth/me
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${res.body.token}`);
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.name, testCase.expectedName);
    }
  });

  // 5. Verify that messages persist when switching demo accounts
  it("Requirement 5: Messages persist and synchronize when switching perspectives", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEMO_MODE = "true";

    // 1. Sign in as Farhan (Recipient)
    const recLogin = await request(app).post("/api/auth/demo-login").send({ role: "recipient" });
    const recToken = recLogin.body.token;

    // Farhan sends a new message in conversation 940001
    const sendRes1 = await request(app)
      .post("/api/chats/940001/messages")
      .set("Authorization", `Bearer ${recToken}`)
      .send({ text: "Hello Usman, are you on your way?" });
    assert.equal(sendRes1.status, 201);
    const msg1Id = sendRes1.body.message.id;

    // 2. Switch perspective to Usman (Donor)
    const donorLogin = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    const donorToken = donorLogin.body.token;

    // Usman inspects the chat history
    const donorHistory = await request(app)
      .get("/api/chats/940001")
      .set("Authorization", `Bearer ${donorToken}`);
    assert.equal(donorHistory.status, 200);
    const msgs = donorHistory.body.conversation.messages;
    assert.ok(msgs.some((m) => m.id === msg1Id && m.text === "Hello Usman, are you on your way?"));

    // Usman replies from his perspective
    const sendRes2 = await request(app)
      .post("/api/chats/940001/messages")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({ text: "Yes Farhan, arriving at Mayo Hospital in 5 minutes." });
    assert.equal(sendRes2.status, 201);
    const msg2Id = sendRes2.body.message.id;

    // 3. Switch perspective back to Farhan (Recipient)
    const recHistory = await request(app)
      .get("/api/chats/940001")
      .set("Authorization", `Bearer ${recToken}`);
    assert.equal(recHistory.status, 200);
    const recMsgs = recHistory.body.conversation.messages;
    assert.ok(recMsgs.some((m) => m.id === msg2Id && m.text === "Yes Farhan, arriving at Mayo Hospital in 5 minutes."));
    assert.ok(recMsgs.some((m) => m.id === msg1Id));
  });

  // 6. Test donor search and blood group matching using demo data
  it("Requirement 6: Donor search, blood group matching, and contact retrieval work with demo data", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEMO_MODE = "true";

    const recLogin = await request(app).post("/api/auth/demo-login").send({ role: "recipient" });
    const authHeader = { Authorization: `Bearer ${recLogin.body.token}` };

    // All demo donors
    const allDonorsRes = await request(app).get("/api/donors").set(authHeader);
    assert.equal(allDonorsRes.status, 200);
    assert.ok(allDonorsRes.body.count >= 2);
    assert.ok(allDonorsRes.body.donors.some((d) => d.name === "Usman Khan (Demo)"));
    assert.ok(allDonorsRes.body.donors.some((d) => d.name === "Ayesha Siddiqui (Demo)"));

    // Filter by blood group O+
    const oDonorsRes = await request(app).get("/api/donors?bloodGroup=O%2B").set(authHeader);
    assert.equal(oDonorsRes.status, 200);
    assert.ok(oDonorsRes.body.donors.every((d) => d.bloodGroup === "O+"));
    assert.ok(oDonorsRes.body.donors.some((d) => d.name === "Usman Khan (Demo)"));
    assert.ok(!oDonorsRes.body.donors.some((d) => d.name === "Ayesha Siddiqui (Demo)"));

    // Filter by blood group A+
    const aDonorsRes = await request(app).get("/api/donors?bloodGroup=A%2B").set(authHeader);
    assert.equal(aDonorsRes.status, 200);
    assert.ok(aDonorsRes.body.donors.every((d) => d.bloodGroup === "A+"));
    assert.ok(aDonorsRes.body.donors.some((d) => d.name === "Ayesha Siddiqui (Demo)"));
    assert.ok(!aDonorsRes.body.donors.some((d) => d.name === "Usman Khan (Demo)"));

    // Contact retrieval
    const contactRes = await request(app).post("/api/donors/900001/contact").set(authHeader);
    assert.equal(contactRes.status, 200);
    assert.equal(contactRes.body.name, "Usman Khan (Demo)");
    assert.equal(contactRes.body.phone, "+92 300 0000001");
  });

  // 7. Test sample emergency request creation and status changes
  it("Requirement 7: Emergency request creation, responses, and cancellation work cleanly", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEMO_MODE = "true";

    const recLogin = await request(app).post("/api/auth/demo-login").send({ role: "recipient" });
    const recAuth = { Authorization: `Bearer ${recLogin.body.token}` };

    // Create a new emergency request
    const createRes = await request(app)
      .post("/api/requests")
      .set(recAuth)
      .send({
        bloodGroup: "O+",
        hospital: "Jinnah Hospital (Demo)",
        city: "Lahore",
        area: "Model Town",
        units: 2,
        urgency: "EMERGENCY",
        requiredDate: new Date().toISOString().slice(0, 10),
        message: "Urgent O+ needed for emergency surgery.",
      });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.request.status, "OPEN");
    const reqCode = createRes.body.request.code;

    // Verify retrieval by code
    const getRes = await request(app).get(`/api/requests/${reqCode}`).set(recAuth);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.request.hospital, "Jinnah Hospital (Demo)");

    // Donor responds to the request
    const donorLogin = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    const donorAuth = { Authorization: `Bearer ${donorLogin.body.token}` };

    const respRes = await request(app)
      .patch(`/api/requests/${reqCode}/respond`)
      .set(donorAuth)
      .send({ donorResponse: "ACCEPTED" });
    assert.equal(respRes.status, 200);

    // Cancel the request
    const cancelRes = await request(app).post(`/api/requests/${reqCode}/cancel`).set(recAuth);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.request.status, "CLOSED");
    assert.equal(cancelRes.body.request.closureReason, "CANCELLED");
  });

  // 8. Verify demo mode cannot activate automatically when backend fails
  it("Requirement 8: Real mode fails closed on backend failure and never activates demo mode", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.DEMO_MODE;
    assert.equal(isDemoModeEnabled(), false);

    // Simulated down backend
    const mockDownPrisma = {
      $queryRaw: async () => {
        throw new Error("Simulated database failure");
      },
    };
    const downApp = createApp(mockDownPrisma, { skipRateLimiters: true });

    // Health check returns 503 degraded
    const healthRes = await request(downApp).get("/api/health");
    assert.equal(healthRes.status, 503);
    assert.equal(healthRes.body.status, "degraded");

    // Public config confirms demoMode is false
    const configRes = await request(downApp).get("/api/config");
    assert.equal(configRes.status, 200);
    assert.equal(configRes.body.demoMode, false);

    // Demo login is forbidden
    const demoLoginRes = await request(downApp).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(demoLoginRes.status, 403);
    assert.equal(demoLoginRes.body.error, "Demo Mode is disabled.");
  });

  // 9. Verify production mode does not accept simulated authentication
  it("Requirement 9: Production mode rejects simulated auth and demo tokens even if DEMO_MODE=true", async () => {
    // Forge a demo token
    const demoToken = jwt.sign(
      { id: 900001, username: "demo.donor", isDemo: true },
      process.env.JWT_SECRET || "lifelink_dev_secret_key_change_in_production"
    );

    // Force production environment
    process.env.NODE_ENV = "production";
    process.env.DEMO_MODE = "true"; // Intentionally set to verify hard override

    assert.equal(isDemoModeEnabled(), false);

    // Demo login endpoint rejects
    const demoLogin = await request(app).post("/api/auth/demo-login").send({ role: "donor" });
    assert.equal(demoLogin.status, 403);

    // Presenting demo token in production is rejected
    const authMe = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${demoToken}`);
    assert.equal(authMe.status, 401);

    // Real login endpoint rejects demo email
    const realLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "demo.donor@lifelink.demo", password: "Password123" });
    assert.equal(realLogin.status, 401);
  });

  // 10. Check that no secrets, real personal info, or real emergency integrations are exposed
  it("Requirement 10: Ensures zero secrets, fictional-only demo data, and no real integrations", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEMO_MODE = "true";

    // 1. Config exposes zero secrets
    const cfgRes = await request(app).get("/api/config");
    assert.equal(cfgRes.status, 200);
    const keys = Object.keys(cfgRes.body);
    assert.deepEqual(keys, ["demoMode", "minAge", "agreementVersion"]);
    assert.equal(cfgRes.body.DATABASE_URL, undefined);
    assert.equal(cfgRes.body.JWT_SECRET, undefined);

    // 2. Demo accounts contain only fictional data
    for (const acc of DEMO_ACCOUNTS) {
      assert.ok(acc.name.includes("(Demo)"), `Name ${acc.name} must be clearly labeled Demo`);
      assert.ok(acc.email.endsWith("@lifelink.demo"), `Email ${acc.email} must use .demo domain`);
      assert.ok(acc.phone.startsWith("+92 300 000000"), `Phone ${acc.phone} must use 000000 prefix`);
      assert.ok(acc.donorIdCode.startsWith("#DEMO-"));
    }

    // 3. Verify no third-party SMS/dispatch libraries exist in package.json
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const disallowed = ["twilio", "sendgrid", "nodemailer", "nexmo", "plivo", "aws-sdk"];
    for (const dis of disallowed) {
      assert.ok(!deps.includes(dis), `Unexpected integration dependency found: ${dis}`);
    }
  });
});
