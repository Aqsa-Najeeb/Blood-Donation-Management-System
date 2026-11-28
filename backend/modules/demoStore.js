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
  {
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
      message: "Simulated emergency blood request for presentation demonstration.",
      status: "OPEN",
      closureReason: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [
        {
          id: 920001,
          requestId: 910001,
          donorId: 900001,
          donorResponse: "ACCEPTED",
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

  const invitations = [
    {
      id: 935001,
      senderId: 900002,
      recipientId: 900001,
      sender: users.get(900002),
      recipient: users.get(900001),
      status: "ACCEPTED",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const conversations = [
    {
      id: 940001,
      userAId: 900001,
      userBId: 900002,
      restrictedById: null,
      requiresReinvite: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      userA: users.get(900001),
      userB: users.get(900002),
      messages: [
        {
          id: 941001,
          conversationId: 940001,
          senderId: 900002,
          sender: { id: 900002, name: "Farhan Malik (Demo)" },
          text: "Hello Usman, I saw your response for the O+ blood request at Mayo Hospital. Are you available today?",
          createdAt: new Date(Date.now() - 3000000).toISOString(),
        },
        {
          id: 941002,
          conversationId: 940001,
          senderId: 900001,
          sender: { id: 900001, name: "Usman Khan (Demo)" },
          text: "Hi Farhan! Yes, I can reach the blood bank by 4 PM. Please have the patient MR number ready.",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    },
  ];

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

function serializeDemoConv(conv, viewerId) {
  const partner = conv.userAId === viewerId ? conv.userB : conv.userA;
  return {
    id: conv.id,
    partner: partner
      ? {
          id: partner.id,
          name: partner.name,
          username: partner.username,
          bloodGroup: partner.bloodGroup,
          city: partner.city,
          area: partner.area,
          isDonor: partner.isDonor,
        }
      : null,
    restrictedById: conv.restrictedById,
    requiresReinvite: conv.requiresReinvite,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  };
}

function createDemoMiddleware() {
  let store = createDemoState();
  const router = express.Router();

  const reset = () => {
    const fresh = createDemoState();
    store.users = fresh.users;
    store.requests = fresh.requests;
    store.notifications = fresh.notifications;
    store.invitations = fresh.invitations;
    store.conversations = fresh.conversations;
    store.reports = fresh.reports;
  };

  // POST /api/auth/demo-reset — resets in-memory demo state
  router.post("/auth/demo-reset", (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ error: "Demo Mode is disabled." });
    }
    reset();
    return res.json({ message: "Demo state reset to initial seed data." });
  });

  // POST /api/auth/demo-login — only works when DEMO_MODE is enabled
  router.post("/auth/demo-login", (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ error: "Demo Mode is disabled." });
    }
    const role = String(req.body?.role || "donor").trim().toLowerCase();
    const account =
      DEMO_ACCOUNTS.find(
        (a) => a.roleKey === role || a.username === role || (role === "ayesha" && a.id === 900003)
      ) || DEMO_ACCOUNTS[0];
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

  return { router, store, reset };
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

  // GET /api/donor/alerts
  if (method === "GET" && path === "/donor/alerts") {
    const alerts = [];
    for (const r of store.requests) {
      const resp = r.responses?.find((item) => item.donorId === user.id);
      if (resp) {
        alerts.push({
          id: resp.id,
          requestId: r.id,
          donorResponse: resp.donorResponse,
          requesterDecision: resp.requesterDecision,
          request: r,
        });
      }
    }
    return res.json({ count: alerts.length, alerts });
  }

  // GET /api/requests
  if (method === "GET" && path === "/requests") {
    const visible = store.requests.filter(
      (r) => r.requesterId === user.id || r.bloodGroup === user.bloodGroup
    );
    return res.json({ count: visible.length, requests: visible });
  }

  // GET /api/requests/:idOrCode
  const reqDetailMatch = /^\/requests\/([^/]+)$/.exec(path);
  if (method === "GET" && reqDetailMatch) {
    const found = store.requests.find(
      (r) => String(r.id) === reqDetailMatch[1] || r.code === reqDetailMatch[1]
    );
    if (!found) return res.status(404).json({ error: "Request not found." });
    return res.json({ request: found });
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
    let resp = reqItem.responses.find((r) => r.donorId === user.id);
    if (!resp) {
      resp = {
        id: store.genId(),
        requestId: reqItem.id,
        donorId: user.id,
        donorResponse: "PENDING",
        requesterDecision: "NONE",
        distanceKm: 4.0,
        donor: { id: user.id, name: user.name, bloodGroup: user.bloodGroup, city: user.city, area: user.area },
      };
      reqItem.responses.push(resp);
    }
    resp.donorResponse = req.body?.donorResponse === "DECLINED" ? "DECLINED" : "ACCEPTED";
    return res.json({ request: reqItem });
  }

  // PATCH /api/requests/:id/decide/:responseId
  const decideMatch = /^\/requests\/([^/]+)\/decide\/(\d+)$/.exec(path);
  if (method === "PATCH" && decideMatch) {
    const reqItem = store.requests.find((r) => String(r.id) === decideMatch[1] || r.code === decideMatch[1]);
    if (!reqItem) return res.status(404).json({ error: "Request not found." });
    if (reqItem.requesterId !== user.id) return res.status(403).json({ error: "Forbidden." });
    const respId = Number(decideMatch[2]);
    const resp = reqItem.responses.find((r) => r.id === respId);
    if (!resp) return res.status(404).json({ error: "Response not found." });
    resp.requesterDecision = req.body?.decision === "ACCEPTED" ? "ACCEPTED" : "DECLINED";
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

  // GET /api/chats — list user's conversations
  if (method === "GET" && path === "/chats") {
    const convs = store.conversations.filter((c) => c.userAId === user.id || c.userBId === user.id);
    return res.json({
      count: convs.length,
      conversations: convs.map((c) => serializeDemoConv(c, user.id)),
    });
  }

  // GET /api/chats/:conversationId — conversation message history
  const chatMatch = /^\/chats\/(\d+)$/.exec(path);
  if (method === "GET" && chatMatch) {
    const convId = Number(chatMatch[1]);
    const conv = store.conversations.find((c) => c.id === convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found." });
    if (conv.userAId !== user.id && conv.userBId !== user.id) {
      return res.status(403).json({ error: "Only participants can view this conversation." });
    }
    return res.json({
      conversation: {
        ...serializeDemoConv(conv, user.id),
        messages: (conv.messages || []).map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender?.name || (store.users.get(m.senderId)?.name ?? null),
          text: m.text,
          createdAt: m.createdAt,
        })),
      },
    });
  }

  // POST /api/chats/:conversationId/messages — send a message
  const msgMatch = /^\/chats\/(\d+)\/messages$/.exec(path);
  if (method === "POST" && msgMatch) {
    const convId = Number(msgMatch[1]);
    const conv = store.conversations.find((c) => c.id === convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found." });
    if (conv.userAId !== user.id && conv.userBId !== user.id) {
      return res.status(403).json({ error: "Only participants can view this conversation." });
    }
    const rawText = req.body?.text;
    if (typeof rawText !== "string" || !rawText.trim() || rawText.trim().length > 1000) {
      return res.status(400).json({ error: "Message must be 1–1000 non-whitespace characters." });
    }
    const cleanText = sanitizeText(rawText, 1000);
    const msg = {
      id: store.genId(),
      conversationId: conv.id,
      senderId: user.id,
      sender: { id: user.id, name: user.name },
      text: cleanText,
      createdAt: new Date().toISOString(),
    };
    conv.messages = conv.messages || [];
    conv.messages.push(msg);
    conv.updatedAt = msg.createdAt;
    return res.status(201).json({ message: msg });
  }

  // PATCH /api/chats/:conversationId/restrict
  const restrictMatch = /^\/chats\/(\d+)\/restrict$/.exec(path);
  if (method === "PATCH" && restrictMatch) {
    const convId = Number(restrictMatch[1]);
    const conv = store.conversations.find((c) => c.id === convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found." });
    if (conv.userAId !== user.id && conv.userBId !== user.id) {
      return res.status(403).json({ error: "Only participants can restrict this conversation." });
    }
    const action = req.body?.action;
    if (action === "apply") {
      conv.restrictedById = user.id;
    } else {
      conv.restrictedById = null;
      conv.requiresReinvite = true;
    }
    return res.json({ conversation: serializeDemoConv(conv, user.id) });
  }

  // GET /api/chats/invitations
  if (method === "GET" && path === "/chats/invitations") {
    return res.json({
      received: store.invitations.filter((i) => i.recipientId === user.id),
      sent: store.invitations.filter((i) => i.senderId === user.id),
    });
  }

  // POST /api/chats/invitations
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

  // PATCH /api/chats/invitations/:id
  const invPatchMatch = /^\/chats\/invitations\/(\d+)$/.exec(path);
  if (method === "PATCH" && invPatchMatch) {
    const invId = Number(invPatchMatch[1]);
    const inv = store.invitations.find((i) => i.id === invId);
    if (!inv) return res.status(404).json({ error: "Invitation not found." });
    if (inv.recipientId !== user.id) {
      return res.status(403).json({ error: "Only the recipient can respond to this invitation." });
    }
    const action = req.body?.action;
    if (!["ACCEPT", "REJECT", "RESTRICT"].includes(action)) {
      return res.status(400).json({ error: "action must be ACCEPT, REJECT, or RESTRICT." });
    }
    inv.status = action === "ACCEPT" ? "ACCEPTED" : action === "REJECT" ? "REJECTED" : "RESTRICTED";
    if (action === "ACCEPT") {
      let conv = store.conversations.find(
        (c) =>
          (c.userAId === inv.senderId && c.userBId === inv.recipientId) ||
          (c.userAId === inv.recipientId && c.userBId === inv.senderId)
      );
      if (!conv) {
        const uAId = Math.min(inv.senderId, inv.recipientId);
        const uBId = Math.max(inv.senderId, inv.recipientId);
        conv = {
          id: store.genId(),
          userAId: uAId,
          userBId: uBId,
          userA: store.users.get(uAId),
          userB: store.users.get(uBId),
          restrictedById: null,
          requiresReinvite: false,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.conversations.unshift(conv);
      }
      return res.json({ invitation: inv, conversation: serializeDemoConv(conv, user.id) });
    }
    return res.json({ invitation: inv });
  }

  return res.status(404).json({ error: "Demo endpoint not found." });
}

module.exports = {
  DEMO_ACCOUNTS,
  isDemoEmail,
  createDemoMiddleware,
};
