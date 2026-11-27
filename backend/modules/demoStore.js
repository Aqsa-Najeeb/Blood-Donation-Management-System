"use strict";

const express = require("express");
const { isDemoModeEnabled } = require("../config/demoMode");
const { requireAuth, signDemoToken, extractBearer, revokeToken } = require("../middleware/auth");
const { sanitizeText, VALID_BLOOD_GROUPS, normalizeReportCategory } = require("../utils/validators");

const DEMO_ACCOUNTS = [
  {
    id: 900001,
    roleKey: "donor",
    name: "Usman Khan (Demo)",
    username: "demo.donor",
    email: "demo.donor@lifelink.demo",
    phone: "+92 300 0000001",
    isDonor: true,
    available: true,
    bloodGroup: "O+",
    city: "Lahore",
    area: "Gulberg III",
    shortArea: "Gulberg",
    donorIdCode: "#DEMO-9001",
    matchingRadiusKm: 10,
    safetyFlags: 0,
    restrictedUntil: null,
  },
  {
    id: 900002,
    roleKey: "recipient",
    name: "Farhan Malik (Demo)",
    username: "demo.recipient",
    email: "demo.recipient@lifelink.demo",
    phone: "+92 300 0000002",
    isDonor: false,
    available: false,
    bloodGroup: "O+",
    city: "Lahore",
    area: "Model Town",
    shortArea: "Model Town",
    donorIdCode: "#DEMO-9002",
    matchingRadiusKm: 10,
    safetyFlags: 0,
    restrictedUntil: null,
  },
];

function isDemoEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return DEMO_ACCOUNTS.some((a) => a.email === normalized);
}

function createDemoState() {
  const users = new Map(
    DEMO_ACCOUNTS.map((u) => [
      u.id,
      {
        ...u,
        lastAvailabilityUpdate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  );

  // Additional sample-only donor visible in demo search
  users.set(900003, {
    id: 900003,
    roleKey: "sample_donor",
    name: "Ayesha Siddiqui (Demo)",
    username: "demo.ayesha",
    email: "demo.ayesha@lifelink.demo",
    phone: "+92 300 0000003",
    isDonor: true,
    available: true,
    bloodGroup: "A+",
    city: "Lahore",
    area: "DHA Phase 5",
    shortArea: "DHA 5",
    donorIdCode: "#DEMO-9003",
    matchingRadiusKm: 10,
    safetyFlags: 0,
    restrictedUntil: null,
    lastAvailabilityUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const requests = [
    {
      id: 910001,
      code: "DEMO-1001",
      requesterId: 900002,
      bloodGroup: "O+",
      hospital: "Mayo Hospital (Demo)",
      city: "Lahore",
      area: "Model Town",
      radius: 10,
      requiredDate: new Date().toISOString().slice(0, 10),
      units: 2,
      urgency: "URGENT",
      contactPhone: "+92 300 0000002",
      message: "Demo emergency blood request.",
      status: "OPEN",
      closureReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [
        {
          id: 920001,
          requestId: 910001,
          donorId: 900001,
          donorResponse: "PENDING",
          requesterDecision: "NONE",
          distanceKm: 4.0,
          donor: { id: 900001, name: "Usman Khan (Demo)", bloodGroup: "O+", city: "Lahore", area: "Gulberg III" },
        },
      ],
    },
  ];

  const notifications = [
    {
      id: 930001,
      userId: 900001,
      type: "REQUEST_MATCH",
      reference: "DEMO-1001",
      title: "Demo Request Match",
      description: "O+ request at Mayo Hospital (Demo) matches your blood group.",
      route: "/request-blood",
      unread: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const invitations = [];
  const conversations = [];
  const reports = [];
  let nextId = 950000;

  return {
    users,
    requests,
    notifications,
    invitations,
    conversations,
    reports,
    genId: () => ++nextId,
  };
}

function createDemoMiddleware() {
  const store = createDemoState();
  const router = express.Router();

  // POST /api/auth/demo-login — only works when DEMO_MODE is enabled
  router.post("/auth/demo-login", (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ error: "Demo Mode is disabled." });
    }
    const role = String(req.body?.role || "donor").trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find((a) => a.roleKey === role) || DEMO_ACCOUNTS[0];
    const user = store.users.get(account.id);
    const token = signDemoToken(user);
    return res.json({ token, user, demoMode: true });
  });

  // Intercept all subsequent /api/* requests for authenticated demo tokens ONLY
  router.use((req, res, next) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return next();

    // Let requireAuth decode and validate token; if it's not a demo token, pass through to real DB routes
    return requireAuth(req, res, () => {
      if (!req.user?.isDemo) {
        return next();
      }
      if (!isDemoModeEnabled()) {
        return res.status(401).json({ error: "Demo Mode is disabled." });
      }
      return handleDemoRequest(req, res, store);
    });
  });

  return { router, store };
}

function handleDemoRequest(req, res, store) {
  const user = store.users.get(req.user.id);
  if (!user) return res.status(401).json({ error: "Demo account not found." });

  const path = req.path;
  const method = req.method.toUpperCase();

  // /api/auth/logout
  if (method === "POST" && path === "/auth/logout") {
    const token = extractBearer(req);
    if (token) revokeToken(token);
    return res.json({ message: "Logged out successfully." });
  }

  // /api/auth/me
  if (method === "GET" && path === "/auth/me") {
    return res.json({ user });
  }

  // /api/donors
  if (method === "GET" && path === "/donors") {
    const bg = req.query.bloodGroup ? String(req.query.bloodGroup).trim().toUpperCase() : "";
    const donors = Array.from(store.users.values())
      .filter((u) => u.isDonor && (!bg || u.bloodGroup === bg))
      .map((u) => ({
        id: u.id,
        name: u.name,
        bloodGroup: u.bloodGroup,
        city: u.city,
        area: u.area,
        available: u.available,
        availabilityLabel: u.available ? "Available" : "Unavailable",
        distance: u.id === user.id ? 0 : 4.0,
        lastAvailabilityUpdate: u.lastAvailabilityUpdate,
        freshness: "Fresh",
        isOutdated: false,
      }));
    return res.json({ count: donors.length, donors });
  }

  // POST /api/donors/:id/contact
  const contactMatch = /^\/donors\/(\d+)\/contact$/.exec(path);
  if (method === "POST" && contactMatch) {
    const target = store.users.get(Number(contactMatch[1]));
    if (!target || !target.isDonor) return res.status(404).json({ error: "Donor not found." });
    return res.json({ donorId: target.id, name: target.name, phone: target.phone });
  }

  // PUT /api/settings or /api/profile
  if (method === "PUT" && (path === "/settings" || path === "/profile" || path.startsWith("/profile/"))) {
    const body = req.body || {};
    if (body.name !== undefined) user.name = sanitizeText(body.name, 100) || user.name;
    if (body.city !== undefined) user.city = sanitizeText(body.city, 80) || user.city;
    if (body.area !== undefined) user.area = sanitizeText(body.area, 160) || user.area;
    if (body.phone !== undefined) user.phone = sanitizeText(body.phone, 30) || user.phone;
    if (body.bloodGroup && VALID_BLOOD_GROUPS.has(String(body.bloodGroup).toUpperCase())) {
      user.bloodGroup = String(body.bloodGroup).toUpperCase();
    }
    if (body.isDonor !== undefined) user.isDonor = Boolean(body.isDonor);
    user.updatedAt = new Date().toISOString();
    return res.json({ message: "Demo profile updated (isolated).", user });
  }

  // PATCH /api/donor/availability
  if (method === "PATCH" && path === "/donor/availability") {
    user.available = Boolean(req.body?.available);
    user.lastAvailabilityUpdate = new Date().toISOString();
    return res.json({ message: "Demo availability updated (isolated).", user });
  }

  // GET /api/requests
  if (method === "GET" && path === "/requests") {
    const visible = store.requests.filter(
      (r) => r.requesterId === user.id || r.bloodGroup === user.bloodGroup
    );
    return res.json({ count: visible.length, requests: visible });
  }

  // POST /api/requests
  if (method === "POST" && path === "/requests") {
    const body = req.body || {};
    const bg = String(body.bloodGroup || "").trim().toUpperCase();
    if (!VALID_BLOOD_GROUPS.has(bg)) {
      return res.status(400).json({ error: "Invalid bloodGroup." });
    }
    const id = store.genId();
    const created = {
      id,
      code: `DEMO-${id}`,
      requesterId: user.id,
      bloodGroup: bg,
      hospital: sanitizeText(body.hospital, 160) || "Demo Hospital",
      city: sanitizeText(body.city, 80) || "Lahore",
      area: sanitizeText(body.area, 160) || "Model Town",
      radius: Number(body.radius) || 10,
      requiredDate: body.requiredDate || new Date().toISOString().slice(0, 10),
      units: Number(body.units) || 1,
      urgency: body.urgency || "URGENT",
      contactPhone: sanitizeText(body.contactPhone, 30) || user.phone,
      message: body.message ? sanitizeText(body.message, 500) : null,
      status: "OPEN",
      closureReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
    };
    store.requests.unshift(created);
    return res.status(201).json({ request: created });
  }

  // POST /api/requests/:id/cancel or /fulfil
  const closeMatch = /^\/requests\/([^/]+)\/(cancel|fulfil)$/.exec(path);
  if (method === "POST" && closeMatch) {
    const reqItem = store.requests.find((r) => String(r.id) === closeMatch[1] || r.code === closeMatch[1]);
    if (!reqItem) return res.status(404).json({ error: "Request not found." });
    if (reqItem.requesterId !== user.id) return res.status(403).json({ error: "Forbidden." });
    reqItem.status = "CLOSED";
    reqItem.closureReason = closeMatch[2] === "cancel" ? "CANCELLED" : "FULFILLED";
    return res.json({ request: reqItem });
  }

  // PATCH /api/requests/:id/respond
  const respondMatch = /^\/requests\/([^/]+)\/respond$/.exec(path);
  if (method === "PATCH" && respondMatch) {
    const reqItem = store.requests.find((r) => String(r.id) === respondMatch[1] || r.code === respondMatch[1]);
    if (!reqItem) return res.status(404).json({ error: "Request not found." });
    const resp = reqItem.responses.find((r) => r.donorId === user.id);
    if (!resp) return res.status(403).json({ error: "Not notified for this request." });
    resp.donorResponse = req.body?.donorResponse === "DECLINED" ? "DECLINED" : "ACCEPTED";
    return res.json({ request: reqItem });
  }

  // GET /api/notifications & POST /api/notifications/read
  if (method === "GET" && path === "/notifications") {
    const items = store.notifications.filter((n) => n.userId === user.id && n.unread);
    return res.json({ count: items.length, notifications: items });
  }
  if (method === "POST" && path === "/notifications/read") {
    let updatedCount = 0;
    for (const n of store.notifications) {
      if (n.userId === user.id && n.unread) {
        n.unread = false;
        updatedCount++;
      }
    }
    return res.json({ message: "Demo notifications marked as read.", updatedCount });
  }

  // POST /api/reports (isolated in memory — never touches real DB)
  if (method === "POST" && path === "/reports") {
    const category = normalizeReportCategory(req.body?.category || "SUSPICIOUS_ACTIVITY");
    if (!category) return res.status(400).json({ error: "Invalid report category." });
    const reason = sanitizeText(req.body?.reason, 1000);
    if (reason.length < 10) return res.status(400).json({ error: "Reason must be at least 10 characters." });
    store.reports.push({
      id: store.genId(),
      targetUserId: Number(req.body?.targetUserId),
      reporterId: user.id,
      category,
      reason,
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({
      message: "Demo safety report recorded (isolated).",
      category,
      autoRestricted: false,
      restrictionScope: null,
    });
  }

  // Chats (isolated in memory)
  if (method === "GET" && path === "/chats") {
    const convs = store.conversations.filter((c) => c.userAId === user.id || c.userBId === user.id);
    return res.json({ count: convs.length, conversations: convs });
  }
  if (method === "GET" && path === "/chats/invitations") {
    return res.json({
      received: store.invitations.filter((i) => i.recipientId === user.id),
      sent: store.invitations.filter((i) => i.senderId === user.id),
    });
  }
  if (method === "POST" && path === "/chats/invitations") {
    const recipientId = Number(req.body?.recipientId);
    const recipient = store.users.get(recipientId);
    if (!recipient || recipientId === user.id) {
      return res.status(400).json({ error: "Invalid demo recipient." });
    }
    const inv = {
      id: store.genId(),
      senderId: user.id,
      recipientId,
      sender: user,
      recipient,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    store.invitations.push(inv);
    return res.status(201).json({ invitation: inv });
  }

  return res.status(404).json({ error: "Demo endpoint not found." });
}

module.exports = {
  DEMO_ACCOUNTS,
  isDemoEmail,
  createDemoMiddleware,
};
