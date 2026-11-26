"use strict";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");

const createApp = require("../backend/app");
const { getTestPrisma, resetTestDb, createTestUser } = require("./helpers");
const { setNow } = require("../backend/utils/clock");
const { setDistanceOverride } = require("../backend/utils/distance");

const TEST_DB_URL =
  process.env.DATABASE_URL_TEST || "mysql://root:password@localhost:3306/lifelink_test";
process.env.DATABASE_URL = TEST_DB_URL;

let app;
let prisma;
let searcherToken;

before(async () => {
  prisma = getTestPrisma();
  app = createApp(prisma, { skipRateLimiters: true });
  await resetTestDb(prisma);

  const reg = await request(app).post("/api/auth/register").send({
    name: "Searcher User",
    email: `searcher_${Date.now()}@test.com`,
    password: "Password123",
    phone: "+92 300 0000001",
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
  });
  assert.equal(reg.status, 201);
  searcherToken = reg.body.token;
});

beforeEach(() => {
  setNow(null);
  setDistanceOverride(null);
});

after(async () => {
  setNow(null);
  setDistanceOverride(null);
  await resetTestDb(prisma);
  await prisma.$disconnect();
});

describe("Slice A3 — Auth & Radius BVA (FR-05, BR-18)", () => {
  it("requires sign-in for GET /api/donors (401 for guests)", async () => {
    const res = await request(app).get("/api/donors");
    assert.equal(res.status, 401);
  });

  it("rejects invalid radius (e.g. 7 km) with 400", async () => {
    const res = await request(app)
      .get("/api/donors?city=Lahore&area=Model%20Town&radius=7")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(res.status, 400);
  });

  it("BVA radius: includes donor at exact radius (10 km) and excludes donor just outside (10.1 km)", async () => {
    const donor = await createTestUser(prisma, {
      name: "Boundary Donor",
      isDonor: true,
      available: true,
      bloodGroup: "A+",
      city: "Lahore",
      area: "Gulberg III",
      lastAvailabilityUpdate: new Date("2026-11-26T10:00:00Z"),
    });

    setNow(new Date("2026-11-27T10:00:00Z"));
    setDistanceOverride(10);
    const inside = await request(app)
      .get("/api/donors?bloodGroup=A%2B&city=Lahore&area=Model%20Town&radius=10")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(inside.status, 200);
    assert.ok(inside.body.donors.some((d) => d.id === donor.id && d.distance === 10));

    setDistanceOverride(10.1);
    const outside = await request(app)
      .get("/api/donors?bloodGroup=A%2B&city=Lahore&area=Model%20Town&radius=10")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(outside.status, 200);
    assert.ok(!outside.body.donors.some((d) => d.id === donor.id));
  });
});

describe("Slice A3 — Freshness BVA & Availability visibility (FR-06, BR-17, NFR-04)", () => {
  it("BVA freshness: 6d 23h is Fresh, 7d 0h is Fresh, 7d 1m is 'May be outdated' without hiding or changing status", async () => {
    const baseNow = new Date("2026-11-27T12:00:00Z");
    setNow(baseNow);

    const d6d23h = await createTestUser(prisma, {
      name: "Donor 6d23h",
      isDonor: true,
      available: true,
      bloodGroup: "B+",
      lastAvailabilityUpdate: new Date(baseNow.getTime() - (6 * 24 + 23) * 60 * 60 * 1000),
    });
    const d7d = await createTestUser(prisma, {
      name: "Donor 7d",
      isDonor: true,
      available: true,
      bloodGroup: "B+",
      lastAvailabilityUpdate: new Date(baseNow.getTime() - 7 * 24 * 60 * 60 * 1000),
    });
    const d7d1m = await createTestUser(prisma, {
      name: "Donor 7d1m",
      isDonor: true,
      available: false,
      bloodGroup: "B+",
      lastAvailabilityUpdate: new Date(baseNow.getTime() - (7 * 24 * 60 + 1) * 60 * 1000),
    });

    const res = await request(app)
      .get("/api/donors?bloodGroup=B%2B&city=Lahore&area=Model%20Town&radius=50")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(res.status, 200);

    const f1 = res.body.donors.find((d) => d.id === d6d23h.id);
    const f2 = res.body.donors.find((d) => d.id === d7d.id);
    const f3 = res.body.donors.find((d) => d.id === d7d1m.id);

    assert.equal(f1.isOutdated, false);
    assert.equal(f1.freshness, "Fresh");

    assert.equal(f2.isOutdated, false);
    assert.equal(f2.freshness, "Fresh");

    assert.equal(f3.isOutdated, true);
    assert.equal(f3.freshness, "May be outdated");
    assert.equal(f3.available, false);
    assert.equal(f3.availabilityLabel, "Unavailable");
  });
});

describe("Slice A3 — Blood group EP & Ordering (FR-05, FR-06, BR-19)", () => {
  it("EP blood group: accepts all 8 valid groups, none selected, and rejects invalid group", async () => {
    const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    for (const bg of groups) {
      const res = await request(app)
        .get(`/api/donors?bloodGroup=${encodeURIComponent(bg)}&city=Lahore&area=Model%20Town&radius=25`)
        .set("Authorization", `Bearer ${searcherToken}`);
      assert.equal(res.status, 200, `Expected 200 for ${bg}`);
    }

    const noneRes = await request(app)
      .get("/api/donors?city=Lahore&area=Model%20Town&radius=25")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(noneRes.status, 200);

    const invalidRes = await request(app)
      .get("/api/donors?bloodGroup=Z%2B&city=Lahore&area=Model%20Town&radius=25")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(invalidRes.status, 400);
  });

  it("orders donors at the same distance by most recent lastAvailabilityUpdate first", async () => {
    const older = await createTestUser(prisma, {
      name: "Older Update",
      isDonor: true,
      available: true,
      bloodGroup: "AB-",
      city: "Lahore",
      area: "Model Town",
      lastAvailabilityUpdate: new Date("2026-11-25T10:00:00Z"),
    });
    const newer = await createTestUser(prisma, {
      name: "Newer Update",
      isDonor: true,
      available: true,
      bloodGroup: "AB-",
      city: "Lahore",
      area: "Model Town",
      lastAvailabilityUpdate: new Date("2026-11-26T10:00:00Z"),
    });

    setNow(new Date("2026-11-27T10:00:00Z"));
    const res = await request(app)
      .get("/api/donors?bloodGroup=AB-&city=Lahore&area=Model%20Town&radius=5")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(res.status, 200);

    const ids = res.body.donors.map((d) => d.id);
    assert.ok(ids.indexOf(newer.id) < ids.indexOf(older.id));
  });
});

describe("Slice A3 — Privacy & Contact (FR-07, BR-21)", () => {
  it("never exposes phone, email, or passwordHash in search results; guest contact returns 401; signed-in contact returns phone; deactivated returns 404", async () => {
    const activeDonor = await createTestUser(prisma, {
      name: "Privacy Donor",
      isDonor: true,
      available: true,
      bloodGroup: "O-",
      phone: "+92 333 9876543",
    });
    const deactivatedDonor = await createTestUser(prisma, {
      name: "Deleted user",
      isDonor: true,
      available: false,
      bloodGroup: "O-",
      deactivatedAt: new Date("2026-11-26T00:00:00Z"),
    });

    const searchRes = await request(app)
      .get("/api/donors?bloodGroup=O-&city=Lahore&area=Model%20Town&radius=50")
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(searchRes.status, 200);

    const found = searchRes.body.donors.find((d) => d.id === activeDonor.id);
    assert.ok(found);
    assert.equal(found.phone, undefined);
    assert.equal(found.email, undefined);
    assert.equal(found.passwordHash, undefined);
    assert.ok(!searchRes.body.donors.some((d) => d.id === deactivatedDonor.id));

    const guestContact = await request(app).post(`/api/donors/${activeDonor.id}/contact`);
    assert.equal(guestContact.status, 401);

    const authContact = await request(app)
      .post(`/api/donors/${activeDonor.id}/contact`)
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(authContact.status, 200);
    assert.equal(authContact.body.phone, "+92 333 9876543");

    const deadContact = await request(app)
      .post(`/api/donors/${deactivatedDonor.id}/contact`)
      .set("Authorization", `Bearer ${searcherToken}`);
    assert.equal(deadContact.status, 404);
  });
});

describe("Slice A3 — Performance NFR-01 (500 donors < 3s)", () => {
  it("returns search results for 500 seeded donors well under 3000ms", async () => {
    const passwordHash = await bcrypt.hash("Perf1234", 4);
    const areas = ["Model Town", "Gulberg III", "DHA Phase 5", "Johar Town Phase 2", "Faisal Town"];
    const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const bulk = Array.from({ length: 500 }, (_, i) => ({
      name: `Perf Donor ${i}`,
      username: `perf_donor_${Date.now()}_${i}`,
      email: `perf_${Date.now()}_${i}@test.com`,
      passwordHash,
      phone: "+92 300 1234567",
      isDonor: true,
      bloodGroup: groups[i % groups.length],
      city: "Lahore",
      area: areas[i % areas.length],
      shortArea: areas[i % areas.length],
      available: i % 2 === 0,
      lastAvailabilityUpdate: new Date("2026-11-26T10:00:00Z"),
    }));

    await prisma.user.createMany({ data: bulk });

    setNow(new Date("2026-11-27T10:00:00Z"));
    const start = performance.now();
    const res = await request(app)
      .get("/api/donors?bloodGroup=O%2B&city=Lahore&area=Model%20Town&radius=25")
      .set("Authorization", `Bearer ${searcherToken}`);
    const elapsedMs = Math.round((performance.now() - start) * 100) / 100;

    console.log(`NFR-01 500-donor search response time: ${elapsedMs} ms (returned ${res.body.count} donors)`);
    assert.equal(res.status, 200);
    assert.ok(res.body.count >= 60);
    assert.ok(elapsedMs < 3000, `Expected < 3000ms, got ${elapsedMs}ms`);
  });
});
