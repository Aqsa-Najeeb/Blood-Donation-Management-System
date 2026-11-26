const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const createApp = require("../backend/app");

function createMockPrisma() {
  const passwordHash = bcrypt.hashSync("LifeLink@2026", 4);
  const state = {
    users: [
      {
        id: 1,
        name: "Hamza Tariq",
        username: "hamza.tariq",
        email: "hamza.tariq@lifelink.pk",
        passwordHash,
        cnic: "35201-1000001-1",
        phone: "+92 300 1110001",
        role: "DONOR",
        bloodGroup: "O+",
        city: "Lahore",
        area: "Gulberg II Sector, Lahore",
        shortArea: "Gulberg II",
        distanceKm: 3.2,
        donorIdCode: "#RK-9001",
        available: true,
        online: true,
        verified: true,
        seenLabel: "Available Now",
        replyLabel: "< 15 mins",
        lastDonationLabel: "4 mos ago",
        lastDonationDays: 114,
        lastConfirmedAt: new Date(),
        strictPhoneShielding: true,
        matchingRadiusKm: 10,
        safetyFlags: 0,
        restrictedUntil: null,
        completedDonations: 6,
        livesImpacted: 18,
        responseRate: 100,
        reliabilityScore: 100,
        honorScore: 99.4,
        recoveryDaysDone: 56,
      },
      {
        id: 2,
        name: "Zainab Fatima",
        username: "zainab.fatima",
        email: "zainab.fatima@lifelink.pk",
        passwordHash,
        cnic: "35201-1000002-2",
        phone: "+92 300 1110002",
        role: "DONOR",
        bloodGroup: "O+",
        city: "Lahore",
        area: "Model Town Perimeter",
        shortArea: "Model Town",
        distanceKm: 4.8,
        donorIdCode: "#RK-9002",
        available: true,
        online: true,
        verified: true,
        seenLabel: "Available Now",
        replyLabel: "< 20 mins",
        lastDonationLabel: "5 mos ago",
        lastDonationDays: 152,
        lastConfirmedAt: new Date(),
        strictPhoneShielding: true,
        matchingRadiusKm: 10,
        safetyFlags: 0,
        restrictedUntil: null,
        completedDonations: 3,
        livesImpacted: 9,
        responseRate: 98,
        reliabilityScore: 98,
        honorScore: 98.2,
        recoveryDaysDone: 56,
      },
      {
        id: 3,
        name: "Bilal Ahmed",
        username: "bilal.ahmed",
        email: "bilal.ahmed@lifelink.pk",
        passwordHash,
        role: "DONOR",
        bloodGroup: "O+",
        city: "Lahore",
        area: "Ferozepur Rd",
        shortArea: "Ferozepur Rd",
        distanceKm: 6.1,
        donorIdCode: "#RK-9003",
        available: true,
        online: true,
        verified: true,
        seenLabel: "Active 45m ago",
        replyLabel: "< 30 mins",
        lastDonationLabel: "7 mos ago",
        lastDonationDays: 210,
        lastConfirmedAt: new Date(),
        strictPhoneShielding: true,
        matchingRadiusKm: 10,
        safetyFlags: 0,
        restrictedUntil: null,
        completedDonations: 9,
        livesImpacted: 27,
        responseRate: 99,
        reliabilityScore: 99,
        honorScore: 99.1,
        recoveryDaysDone: 56,
      },
      {
        id: 4,
        name: "Farhan Malik",
        username: "farhan.malik",
        email: "farhan.malik@lifelink.pk",
        passwordHash,
        cnic: "35201-5555123-7",
        phone: "+92 300 8129031",
        role: "RECIPIENT",
        bloodGroup: "O+",
        city: "Lahore",
        area: "Mayo Central Corridor",
        shortArea: "Mayo Sector",
        distanceKm: 2.0,
        donorIdCode: null,
        available: false,
        online: true,
        verified: true,
        seenLabel: "Available Now",
        replyLabel: "< 15 mins",
        lastDonationLabel: "Never",
        lastDonationDays: 0,
        lastConfirmedAt: new Date(),
        strictPhoneShielding: true,
        matchingRadiusKm: 10,
        safetyFlags: 0,
        restrictedUntil: null,
        completedDonations: 0,
        livesImpacted: 0,
        responseRate: 100,
        reliabilityScore: 100,
        honorScore: 99.0,
        recoveryDaysDone: 56,
      },
    ],
    milestones: [],
    requests: [
      {
        id: 1,
        code: "BR-9402",
        requesterId: 4,
        bloodGroup: "O+",
        units: 2,
        caseCategory: "ICU",
        urgency: "URGENT",
        hospital: "Mayo Hospital, Lahore",
        ward: "ICU Ward 2",
        city: "Lahore, Punjab",
        requiredBy: "Today, 6:00 PM",
        patientName: "Farhan Malik",
        attendantName: "Farhan Malik",
        doctorName: "Dr. S. Aslam",
        labId: "MH-LAB-44816",
        crossMatchStatus: "Sample Stored in Lab #2",
        slipNumber: "#488",
        stage: 3,
        status: "ACTIVE",
        notes: "2 units O+ needed",
        rating: null,
        createdAt: new Date(),
      },
    ],
    invitations: [
      {
        id: 1,
        requestId: 1,
        donorId: 1,
        status: "PENDING",
        eta: "~25 Mins",
        targetTime: "3:15 PM",
        distanceLabel: "3.2 km away",
        donorStep: 1,
        respondedAt: "Invited",
        createdAt: new Date(),
      },
    ],
    threads: [
      {
        id: 1,
        requestId: 1,
        donorId: 1,
        recipientId: 4,
        hospital: "Mayo Hospital",
        statusTag: "Active",
        archived: false,
        updatedAt: new Date(),
      },
    ],
    messages: [],
    notifications: [
      { id: 1, userId: 1, title: "Donor Alert", description: "Mayo Hospital", route: "/donor-dashboard", unread: true, createdAt: new Date() },
      { id: 2, userId: 4, title: "Recipient Alert", description: "Private", route: "/chat", unread: true, createdAt: new Date() },
    ],
    reports: [],
    subscribers: [],
  };

  let nextIds = { user: 5, req: 2, inv: 2, thread: 2, msg: 1, report: 1, sub: 1 };

  const hydrateReq = (r) => ({
    ...r,
    invitations: state.invitations
      .filter((i) => i.requestId === r.id)
      .map((i) => ({ ...i, donor: state.users.find((u) => u.id === i.donorId) })),
  });

  return {
    _state: state,
    $queryRaw: async () => [{ 1: 1 }],
    user: {
      findFirst: async ({ where }) => {
        if (!where) return state.users[0] || null;
        return (
          state.users.find((u) => {
            if (where.OR) {
              return where.OR.some((cond) => Object.entries(cond).every(([k, v]) => u[k] === v));
            }
            return Object.entries(where).every(([k, v]) => {
              if (k === "id" && v && typeof v === "object" && v.not !== undefined) return u.id !== v.not;
              if (k === "seenLabel" && v && typeof v === "object" && v.not !== undefined) return u.seenLabel !== v.not;
              return u[k] === v;
            });
          }) || null
        );
      },
      findUnique: async ({ where }) =>
        state.users.find((u) => Object.entries(where).every(([k, v]) => u[k] === v)) || null,
      findMany: async ({ where = {}, take }) => {
        let rows = state.users.filter((u) => {
          if (where.role && u.role !== where.role) return false;
          if (where.bloodGroup && u.bloodGroup !== where.bloodGroup) return false;
          if (where.available !== undefined && u.available !== where.available) return false;
          if (where.online !== undefined && u.online !== where.online) return false;
          if (where.seenLabel?.not !== undefined && u.seenLabel === where.seenLabel.not) return false;
          if (where.id?.not !== undefined && u.id === where.id.not) return false;
          if (where.id?.in && !where.id.in.includes(u.id)) return false;
          if (where.distanceKm?.lte !== undefined && u.distanceKm > where.distanceKm.lte) return false;
          return true;
        });
        if (take) rows = rows.slice(0, take);
        return rows.map((u) => ({ ...u, milestones: state.milestones.filter((m) => m.donorId === u.id) }));
      },
      groupBy: async () => {
        const counts = {};
        state.users.filter((u) => u.role === "DONOR" && u.available).forEach((u) => {
          counts[u.bloodGroup] = (counts[u.bloodGroup] || 0) + 1;
        });
        return Object.entries(counts).map(([bloodGroup, id]) => ({ bloodGroup, _count: { id } }));
      },
      create: async ({ data }) => {
        const created = {
          id: nextIds.user++,
          distanceKm: 4.0,
          online: true,
          verified: true,
          seenLabel: "Available Now",
          replyLabel: "< 15 mins",
          lastDonationLabel: "Never",
          lastDonationDays: 0,
          lastConfirmedAt: new Date(),
          strictPhoneShielding: true,
          matchingRadiusKm: 10,
          safetyFlags: 0,
          restrictedUntil: null,
          completedDonations: 0,
          livesImpacted: 0,
          responseRate: 100,
          reliabilityScore: 100,
          honorScore: 99.0,
          recoveryDaysDone: 56,
          ...data,
        };
        state.users.push(created);
        return { ...created, milestones: [] };
      },
      update: async ({ where, data }) => {
        const user = state.users.find((u) => u.id === where.id);
        Object.entries(data).forEach(([k, v]) => {
          if (v && typeof v === "object" && v.increment !== undefined) {
            user[k] = (user[k] || 0) + v.increment;
          } else {
            user[k] = v;
          }
        });
        return { ...user, milestones: [] };
      },
    },
    bloodRequest: {
      findMany: async ({ where = {} } = {}) => {
        return state.requests
          .filter((r) => {
            if (where.status && r.status !== where.status) return false;
            if (where.requesterId && r.requesterId !== where.requesterId) return false;
            if (where.OR) {
              const matches = where.OR.some((cond) => {
                if (cond.requesterId !== undefined) return r.requesterId === cond.requesterId;
                if (cond.invitations?.some?.donorId !== undefined) {
                  return state.invitations.some(
                    (i) => i.requestId === r.id && i.donorId === cond.invitations.some.donorId
                  );
                }
                return false;
              });
              if (!matches) return false;
            }
            return true;
          })
          .map(hydrateReq);
      },
      findUnique: async ({ where }) => {
        const found = state.requests.find((r) => (where.id ? r.id === where.id : r.code === where.code));
        return found ? hydrateReq(found) : null;
      },
      create: async ({ data }) => {
        const { invitations, ...rest } = data;
        const created = { id: nextIds.req++, createdAt: new Date(), ...rest };
        state.requests.unshift(created);
        if (invitations?.create) {
          invitations.create.forEach((inv) => {
            state.invitations.push({ id: nextIds.inv++, requestId: created.id, donorStep: 1, ...inv });
          });
        }
        return hydrateReq(created);
      },
      update: async ({ where, data }) => {
        const found = state.requests.find((r) => r.id === where.id);
        Object.assign(found, data);
        return hydrateReq(found);
      },
    },
    requestInvitation: {
      findMany: async ({ where = {} } = {}) =>
        state.invitations
          .filter((i) => {
            if (where.donorId && i.donorId !== where.donorId) return false;
            if (where.status?.in && !where.status.in.includes(i.status)) return false;
            return true;
          })
          .map((i) => ({
            ...i,
            request: state.requests.find((r) => r.id === i.requestId),
            donor: state.users.find((u) => u.id === i.donorId),
          })),
      findUnique: async ({ where }) => {
        const found = state.invitations.find((i) => i.id === where.id);
        if (!found) return null;
        return {
          ...found,
          request: state.requests.find((r) => r.id === found.requestId),
          donor: state.users.find((u) => u.id === found.donorId),
        };
      },
      create: async ({ data }) => {
        const created = { id: nextIds.inv++, donorStep: 1, ...data };
        state.invitations.push(created);
        return created;
      },
      update: async ({ where, data }) => {
        const found = state.invitations.find((i) => i.id === where.id);
        Object.assign(found, data);
        return {
          ...found,
          request: state.requests.find((r) => r.id === found.requestId),
          donor: state.users.find((u) => u.id === found.donorId),
        };
      },
      updateMany: async ({ where, data }) => {
        state.invitations.forEach((i) => {
          if (i.requestId === where.requestId && i.status === where.status) Object.assign(i, data);
        });
      },
    },
    chatThread: {
      findMany: async ({ where = {} } = {}) =>
        state.threads
          .filter((t) => {
            if (where.OR) {
              const ok = where.OR.some((c) => (c.donorId ? t.donorId === c.donorId : t.recipientId === c.recipientId));
              if (!ok) return false;
            }
            if (where.archived !== undefined && t.archived !== where.archived) return false;
            return true;
          })
          .map((t) => ({
            ...t,
            donor: state.users.find((u) => u.id === t.donorId),
            request: state.requests.find((r) => r.id === t.requestId),
            messages: state.messages.filter((m) => m.threadId === t.id),
          })),
      findUnique: async ({ where }) => state.threads.find((t) => t.id === where.id) || null,
      upsert: async ({ where, update, create }) => {
        const key = where.requestId_donorId;
        let found = state.threads.find((t) => t.requestId === key.requestId && t.donorId === key.donorId);
        if (found) {
          Object.assign(found, update);
        } else {
          const { messages, ...rest } = create;
          found = { id: nextIds.thread++, updatedAt: new Date(), ...rest };
          state.threads.push(found);
          if (messages?.create) {
            state.messages.push({ id: nextIds.msg++, threadId: found.id, createdAt: new Date(), ...messages.create });
          }
        }
        return {
          ...found,
          donor: state.users.find((u) => u.id === found.donorId),
          messages: state.messages.filter((m) => m.threadId === found.id),
        };
      },
      update: async ({ where, data }) => {
        const found = state.threads.find((t) => t.id === where.id);
        Object.assign(found, data);
        return found;
      },
    },
    chatMessage: {
      create: async ({ data }) => {
        const msg = { id: nextIds.msg++, createdAt: new Date(), ...data };
        state.messages.push(msg);
        return msg;
      },
    },
    notification: {
      findMany: async ({ where = {} } = {}) =>
        state.notifications.filter((n) => (where.userId ? n.userId === where.userId : true)),
      updateMany: async ({ where = {}, data = {} } = {}) =>
        state.notifications.forEach((n) => {
          if (!where.userId || n.userId === where.userId) Object.assign(n, data);
        }),
    },
    safetyReport: {
      findFirst: async ({ where }) =>
        state.reports.find(
          (r) => r.targetUserId === where.targetUserId && r.reporterId === where.reporterId
        ) || null,
      create: async ({ data }) => {
        const r = { id: nextIds.report++, ...data };
        state.reports.push(r);
        return r;
      },
      count: async ({ where }) => state.reports.filter((r) => r.targetUserId === where.targetUserId).length,
    },
    newsletterSubscriber: {
      upsert: async ({ create }) => {
        let s = state.subscribers.find((x) => x.email === create.email);
        if (!s) {
          s = { id: nextIds.sub++, email: create.email };
          state.subscribers.push(s);
        }
        return s;
      },
    },
  };
}

describe("Life Link Functional & Security Test Suite", () => {
  const prisma = createMockPrisma();
  const app = createApp(prisma);

  async function loginAs(username, password = "LifeLink@2026") {
    const res = await request(app).post("/api/auth/login").send({ username, password });
    assert.equal(res.status, 200);
    return res.body.token;
  }

  it("sets security headers, disables x-powered-by, and blocks untrusted CORS origin", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.headers["x-powered-by"], undefined);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.equal(res.headers["x-frame-options"], "DENY");

    const badCors = await request(app).get("/api/health").set("Origin", "https://evil-attacker.example");
    assert.equal(badCors.status, 403);
  });

  it("blocks unauthenticated access to protected endpoints", async () => {
    const endpoints = [
      ["get", "/api/auth/me"],
      ["get", "/api/requests"],
      ["get", "/api/requests/BR-9402"],
      ["post", "/api/requests"],
      ["post", "/api/requests/BR-9402/cancel"],
      ["get", "/api/donor/alerts"],
      ["post", "/api/donor/alerts/1/accept"],
      ["get", "/api/chats"],
      ["post", "/api/chats/1/messages"],
      ["get", "/api/notifications"],
      ["put", "/api/settings"],
      ["post", "/api/reports"],
    ];
    for (const [method, url] of endpoints) {
      const res = await request(app)[method](url).send({});
      assert.equal(res.status, 401, `Expected 401 on ${method.toUpperCase()} ${url}, got ${res.status}`);
    }
  });

  it("prevents passwordless demo login bypass and enforces brute-force lockout", async () => {
    const bypass = await request(app).post("/api/auth/login").send({ demoRole: "donor" });
    assert.equal(bypass.status, 400);

    for (let i = 0; i < 5; i++) {
      const fail = await request(app)
        .post("/api/auth/login")
        .send({ username: "bilal.ahmed", password: "WrongPassword1!" });
      assert.equal(fail.status, 401);
    }
    const locked = await request(app)
      .post("/api/auth/login")
      .send({ username: "bilal.ahmed", password: "LifeLink@2026" });
    assert.equal(locked.status, 429);
  });

  it("prevents role escalation during registration and mass assignment on settings", async () => {
    const adminReg = await request(app).post("/api/auth/register").send({
      name: "Escalator",
      email: "escalator@lifelink.pk",
      password: "Password123!",
      role: "COORDINATOR",
      bloodGroup: "O+",
    });
    assert.equal(adminReg.status, 403);

    const weakPw = await request(app).post("/api/auth/register").send({
      name: "Weak User",
      email: "weak@lifelink.pk",
      password: "123",
      bloodGroup: "O+",
    });
    assert.equal(weakPw.status, 400);

    const token = await loginAs("zainab.fatima");
    for (const field of ["role", "safetyFlags", "restrictedUntil", "verified"]) {
      const tamper = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ [field]: "ADMIN" });
      assert.equal(tamper.status, 403);
    }
  });

  it("sanitizes XSS payloads and rejects invalid IDs / injection-style inputs", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "Alice <script>alert(1)</script> Donor",
      email: "alice.xss@lifelink.pk",
      password: "Password123!",
      bloodGroup: "A+",
      city: "Lahore",
    });
    assert.equal(reg.status, 201);
    assert.ok(!reg.body.user.name.includes("<script>"));

    const badId = await request(app).get("/api/donors/1;DROP TABLE users");
    assert.equal(badId.status, 400);

    const badBlood = await request(app).get("/api/donors?bloodGroup=Z%2B");
    assert.equal(badBlood.status, 400);
  });

  it("prevents donor PII leakage on public donor listings", async () => {
    const res = await request(app).get("/api/donors?bloodGroup=O%2B&radius=5");
    assert.equal(res.status, 200);
    assert.ok(res.body.count >= 2);
    for (const d of res.body.donors) {
      assert.equal(d.passwordHash, undefined);
      assert.equal(d.phone, undefined);
      assert.equal(d.email, undefined);
      assert.equal(d.cnic, undefined);
      assert.equal(d.safetyFlags, undefined);
      assert.equal(d.restrictedUntil, undefined);
    }
  });

  it("prevents IDOR across requests, donor alerts, chat threads, and notifications", async () => {
    const zainabToken = await loginAs("zainab.fatima"); // id=2, not participant on BR-9402 (requester=4, donor=1)
    const farhanToken = await loginAs("farhan.malik");  // id=4, requester of BR-9402
    const hamzaToken = await loginAs("hamza.tariq");    // id=1, invited donor on BR-9402

    assert.equal((await request(app).get("/api/requests/BR-9402").set("Authorization", `Bearer ${zainabToken}`)).status, 403);
    assert.equal((await request(app).patch("/api/requests/BR-9402/stage").set("Authorization", `Bearer ${zainabToken}`).send({ stage: 5 })).status, 403);
    assert.equal((await request(app).post("/api/requests/BR-9402/cancel").set("Authorization", `Bearer ${hamzaToken}`)).status, 403);
    assert.equal((await request(app).post("/api/donor/alerts/1/accept").set("Authorization", `Bearer ${zainabToken}`)).status, 403);
    assert.equal((await request(app).post("/api/chats/1/messages").set("Authorization", `Bearer ${zainabToken}`).send({ text: "Intruder" })).status, 403);

    // Notifications are strictly scoped to the logged-in user
    const zNotif = await request(app).get("/api/notifications").set("Authorization", `Bearer ${zainabToken}`);
    assert.equal(zNotif.status, 200);
    assert.equal(zNotif.body.notifications.length, 0);

    // Chat derives senderRole server-side (cannot spoof SYSTEM)
    const msg = await request(app)
      .post("/api/chats/1/messages")
      .set("Authorization", `Bearer ${farhanToken}`)
      .send({ text: "See you at <script>x()</script> Window 3", senderRole: "SYSTEM" });
    assert.equal(msg.status, 201);
    assert.equal(msg.body.message.senderRole, "RECIPIENT");
    assert.ok(!msg.body.message.text.includes("<script>"));
  });

  it("enforces reporting rules: categories, no self-report, deduplication, 3-report 7-day emergency restriction & expiry", async () => {
    const rep1Token = await loginAs("hamza.tariq");   // id=1
    const rep2Token = await loginAs("zainab.fatima"); // id=2
    const rep3Token = await loginAs("alice.xss@lifelink.pk", "Password123!"); // id=5

    // Create a clean target user
    const targetReg = await request(app).post("/api/auth/register").send({
      name: "Target Requester",
      email: "target.req@lifelink.pk",
      password: "Password123!",
      role: "RECIPIENT",
      bloodGroup: "B+",
    });
    assert.equal(targetReg.status, 201);
    const targetId = targetReg.body.user.id;
    const targetToken = targetReg.body.token;

    // Self-report blocked
    const selfRep = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${targetToken}`)
      .send({ targetUserId: targetId, category: "HARASSMENT", reason: "Testing self report prevention" });
    assert.equal(selfRep.status, 400);

    // Invalid category & short reason blocked
    assert.equal(
      (await request(app).post("/api/reports").set("Authorization", `Bearer ${rep1Token}`).send({
        targetUserId: targetId,
        category: "INVALID_CAT",
        reason: "Valid length reason here",
      })).status,
      400
    );
    assert.equal(
      (await request(app).post("/api/reports").set("Authorization", `Bearer ${rep1Token}`).send({
        targetUserId: targetId,
        category: "HARASSMENT",
        reason: "short",
      })).status,
      400
    );

    // Client cannot manipulate report count or duration
    assert.equal(
      (await request(app).post("/api/reports").set("Authorization", `Bearer ${rep1Token}`).send({
        targetUserId: targetId,
        category: "HARASSMENT",
        reason: "Valid detailed report text",
        safetyFlags: 99,
      })).status,
      403
    );

    // Report 1 from reporter 1
    const r1 = await request(app).post("/api/reports").set("Authorization", `Bearer ${rep1Token}`).send({
      targetUserId: targetId,
      category: "FALSE_DONOR_INFO",
      reason: "User submitted fabricated medical ward information.",
    });
    assert.equal(r1.status, 201);
    assert.equal(r1.body.safetyFlags, 1);
    assert.equal(r1.body.autoRestricted, false);

    // Duplicate report from SAME reporter 1 does not count repeatedly
    const dup = await request(app).post("/api/reports").set("Authorization", `Bearer ${rep1Token}`).send({
      targetUserId: targetId,
      category: "HARASSMENT",
      reason: "Attempting duplicate report from same reporter.",
    });
    assert.equal(dup.status, 409);

    // Report 2 from reporter 2
    const r2 = await request(app).post("/api/reports").set("Authorization", `Bearer ${rep2Token}`).send({
      targetUserId: targetId,
      category: "INAPPROPRIATE_CONTENT",
      reason: "Sent inappropriate solicitation in coordination thread.",
    });
    assert.equal(r2.status, 201);
    assert.equal(r2.body.autoRestricted, false);

    // Report 3 from reporter 3 triggers 7-day emergency request restriction
    const r3 = await request(app).post("/api/reports").set("Authorization", `Bearer ${rep3Token}`).send({
      targetUserId: targetId,
      category: "SUSPICIOUS_ACTIVITY",
      reason: "Repeated suspicious requests across unrelated hospitals.",
    });
    assert.equal(r3.status, 201);
    assert.equal(r3.body.safetyFlags, 3);
    assert.equal(r3.body.autoRestricted, true);

    // Restricted user CANNOT create new EMERGENCY request (403)
    const blockedEmerg = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${targetToken}`)
      .send({ bloodGroup: "O+", units: 1, hospital: "Services Hospital", urgency: "EMERGENCY" });
    assert.equal(blockedEmerg.status, 403);

    // Unrelated functionality (updating profile settings / reading donors / STANDARD scheduled request) still works
    const settingsOk = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${targetToken}`)
      .send({ city: "Lahore" });
    assert.equal(settingsOk.status, 200);

    const standardOk = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${targetToken}`)
      .send({ bloodGroup: "O+", units: 1, hospital: "Planned Care Clinic", urgency: "STANDARD" });
    assert.equal(standardOk.status, 201);

    // Once 7-day restriction expires, EMERGENCY request creation works again
    const targetRecord = prisma._state.users.find((u) => u.id === targetId);
    targetRecord.restrictedUntil = new Date(Date.now() - 1000);
    const expiredOk = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${targetToken}`)
      .send({ bloodGroup: "O-", units: 1, hospital: "Jinnah Hospital Ward 1", urgency: "EMERGENCY" });
    assert.equal(expiredOk.status, 201);
  });

  it("enforces duplicate/spam emergency request limits, 3-donor cap, and payload limits", async () => {
    const farhanToken = await loginAs("farhan.malik");

    // Duplicate active request blocked (BR-9402 is O+ at Mayo Hospital, Lahore)
    const dupReq = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${farhanToken}`)
      .send({ bloodGroup: "O+", units: 2, hospital: "Mayo Hospital, Lahore", urgency: "EMERGENCY" });
    assert.equal(dupReq.status, 409);

    // Exceeding max 3 concurrent donors blocked
    const overCap = await request(app)
      .post("/api/requests/BR-9402/invite")
      .set("Authorization", `Bearer ${farhanToken}`)
      .send({ donorIds: [2, 3, 5] });
    assert.equal(overCap.status, 400);

    // Oversized payload rejected with 413
    const hugeBody = { bloodGroup: "O+", hospital: "A".repeat(40_000) };
    const hugeRes = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${farhanToken}`)
      .send(hugeBody);
    assert.equal(hugeRes.status, 413);
  });

  it("completes legitimate workflows: donor accept, stage fulfillment, and newsletter", async () => {
    const hamzaToken = await loginAs("hamza.tariq");
    const farhanToken = await loginAs("farhan.malik");

    const acc = await request(app)
      .post("/api/donor/alerts/1/accept")
      .set("Authorization", `Bearer ${hamzaToken}`);
    assert.equal(acc.status, 200);
    assert.equal(acc.body.invitation.status, "ACCEPTED");

    const stageRes = await request(app)
      .patch("/api/requests/BR-9402/stage")
      .set("Authorization", `Bearer ${farhanToken}`)
      .send({ stage: 5 });
    assert.equal(stageRes.status, 200);
    assert.equal(stageRes.body.request.status, "FULFILLED");

    const newsBad = await request(app).post("/api/newsletter").send({ email: "bad" });
    assert.equal(newsBad.status, 400);
    const newsOk = await request(app).post("/api/newsletter").send({ email: "hero@lifelink.pk" });
    assert.equal(newsOk.status, 201);
  });
});
