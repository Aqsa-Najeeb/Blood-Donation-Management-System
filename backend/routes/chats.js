"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { sanitizeUser } = require("../utils/serializers");
const { sanitizeText } = require("../utils/validators");
const { now } = require("../utils/clock");

function createChatsRouter(prisma, { chatLimiter } = {}) {
  const router = express.Router();

  async function ensureActiveCaller(req, res) {
    const caller = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, deactivatedAt: true },
    });
    if (!caller || caller.deactivatedAt) {
      res.status(401).json({ error: "Account not found or deactivated." });
      return false;
    }
    return true;
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /** Canonical pair key: lower id is userAId */
  function pairIds(a, b) {
    return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
  }

  /** Is viewer a participant of this conversation? */
  function isParticipant(conv, viewerId) {
    return conv.userAId === viewerId || conv.userBId === viewerId;
  }

  /** Is this conversation blocked (restricted OR requiresReinvite)? */
  function isBlocked(conv) {
    return conv.restrictedById !== null || conv.requiresReinvite;
  }

  function serializeConv(conv, viewerId) {
    const partner = conv.userAId === viewerId ? conv.userB : conv.userA;
    return {
      id: conv.id,
      partner: partner ? sanitizeUser(partner, { includePrivate: false }) : null,
      restrictedById: conv.restrictedById,
      requiresReinvite: conv.requiresReinvite,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  // ── POST /api/chats/invitations — send an invitation ─────────────────────
  router.post("/invitations", requireAuth, ...(chatLimiter ? [chatLimiter] : []), async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const recipientId = Number(req.body?.recipientId);
      if (!recipientId || !Number.isInteger(recipientId) || recipientId <= 0) {
        return res.status(400).json({ error: "recipientId must be a positive integer." });
      }
      if (recipientId === req.user.id) {
        return res.status(400).json({ error: "You cannot invite yourself." });
      }

      const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
      if (!recipient || recipient.deactivatedAt) {
        return res.status(400).json({ error: "Recipient not found or account is deactivated." });
      }

      // Check restriction in either direction
      const pair = pairIds(req.user.id, recipientId);
      const conv = await prisma.conversation.findUnique({ where: { userAId_userBId: pair } });
      if (conv && conv.restrictedById !== null) {
        return res.status(409).json({ error: "A restriction is in place between you and this user." });
      }

      // Check 24h cooldown after REJECT (sender → recipient direction)
      const existingFwd = await prisma.chatInvitation.findUnique({
        where: { senderId_recipientId: { senderId: req.user.id, recipientId } },
      });
      if (existingFwd) {
        if (existingFwd.status === "PENDING") {
          return res.status(409).json({ error: "You already have a pending invitation to this user." });
        }
        if (existingFwd.status === "ACCEPTED" && (!conv || !conv.requiresReinvite)) {
          return res.status(409).json({ error: "A conversation with this user already exists." });
        }
        if (existingFwd.status === "REJECTED" && existingFwd.rejectedAt) {
          const cooldownMs = 24 * 60 * 60 * 1000;
          const elapsed = now() - new Date(existingFwd.rejectedAt);
          if (elapsed < cooldownMs) {
            return res.status(409).json({ error: "You must wait 24 hours after a rejection before inviting again." });
          }
        }
      }

      // Block if the reverse direction already has a pending invite
      const existingRev = await prisma.chatInvitation.findUnique({
        where: { senderId_recipientId: { senderId: recipientId, recipientId: req.user.id } },
      });
      if (existingRev && existingRev.status === "PENDING") {
        return res.status(409).json({ error: "This user has already sent you a pending invitation." });
      }

      // Upsert (re-invite after REJECTED cooldown has elapsed)
      const invitation = await prisma.chatInvitation.upsert({
        where: { senderId_recipientId: { senderId: req.user.id, recipientId } },
        update: { status: "PENDING", rejectedAt: null, updatedAt: now() },
        create: { senderId: req.user.id, recipientId, status: "PENDING" },
      });

      return res.status(201).json({ invitation });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /api/chats/invitations — list received + sent ────────────────────
  router.get("/invitations", requireAuth, async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const [received, sent] = await Promise.all([
        prisma.chatInvitation.findMany({
          where: { recipientId: req.user.id },
          include: { sender: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.chatInvitation.findMany({
          where: { senderId: req.user.id },
          include: { recipient: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return res.json({
        received: received.map((inv) => ({
          ...inv,
          sender: sanitizeUser(inv.sender, { includePrivate: false }),
        })),
        sent: sent.map((inv) => ({
          ...inv,
          recipient: sanitizeUser(inv.recipient, { includePrivate: false }),
        })),
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── PATCH /api/chats/invitations/:id — ACCEPT / REJECT / RESTRICT ────────
  router.patch("/invitations/:id", requireAuth, async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const id = Number(req.params.id);
      if (!id || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid invitation id." });
      }
      const action = req.body?.action;
      if (!["ACCEPT", "REJECT", "RESTRICT"].includes(action)) {
        return res.status(400).json({ error: "action must be ACCEPT, REJECT, or RESTRICT." });
      }

      const inv = await prisma.chatInvitation.findUnique({ where: { id } });
      if (!inv) return res.status(404).json({ error: "Invitation not found." });
      if (inv.recipientId !== req.user.id) {
        return res.status(403).json({ error: "Only the recipient can respond to this invitation." });
      }
      if (inv.status !== "PENDING") {
        return res.status(409).json({ error: "This invitation is no longer pending." });
      }

      if (action === "ACCEPT") {
        const pair = pairIds(inv.senderId, inv.recipientId);
        // Create or reopen the conversation; clear requiresReinvite
        const [updatedInv, conv] = await prisma.$transaction([
          prisma.chatInvitation.update({
            where: { id },
            data: { status: "ACCEPTED" },
          }),
          prisma.conversation.upsert({
            where: { userAId_userBId: pair },
            update: { requiresReinvite: false, updatedAt: now() },
            create: { ...pair, requiresReinvite: false },
          }),
        ]);
        return res.json({ invitation: updatedInv, conversation: conv });
      }

      if (action === "REJECT") {
        const updatedInv = await prisma.chatInvitation.update({
          where: { id },
          data: { status: "REJECTED", rejectedAt: now() },
        });
        return res.json({ invitation: updatedInv });
      }

      // RESTRICT — applies a restriction on the conversation pair
      const pair = pairIds(inv.senderId, inv.recipientId);
      const [updatedInv, conv] = await prisma.$transaction([
        prisma.chatInvitation.update({
          where: { id },
          data: { status: "RESTRICTED" },
        }),
        prisma.conversation.upsert({
          where: { userAId_userBId: pair },
          update: { restrictedById: req.user.id, updatedAt: now() },
          create: { ...pair, restrictedById: req.user.id },
        }),
      ]);
      return res.json({ invitation: updatedInv, conversation: conv });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /api/chats — list user's conversations ────────────────────────────
  router.get("/", requireAuth, async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const convs = await prisma.conversation.findMany({
        where: {
          OR: [{ userAId: req.user.id }, { userBId: req.user.id }],
        },
        include: { userA: true, userB: true },
        orderBy: { updatedAt: "desc" },
      });

      return res.json({
        count: convs.length,
        conversations: convs.map((c) => serializeConv(c, req.user.id)),
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── GET /api/chats/:conversationId — history ──────────────────────────────
  router.get("/:conversationId", requireAuth, async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const convId = Number(req.params.conversationId);
      if (!convId || !Number.isInteger(convId) || convId <= 0) {
        return res.status(400).json({ error: "Invalid conversationId." });
      }

      const conv = await prisma.conversation.findUnique({
        where: { id: convId },
        include: {
          userA: true,
          userB: true,
          messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
        },
      });
      if (!conv) return res.status(404).json({ error: "Conversation not found." });
      if (!isParticipant(conv, req.user.id)) {
        return res.status(403).json({ error: "Only participants can view this conversation." });
      }

      return res.json({
        conversation: {
          ...serializeConv(conv, req.user.id),
          messages: conv.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender?.name || null,
            text: m.text,
            createdAt: m.createdAt,
          })),
        },
      });
    } catch (err) {
      return next(err);
    }
  });

  // ── POST /api/chats/:conversationId/messages — send a message ─────────────
  router.post("/:conversationId/messages", requireAuth, ...(chatLimiter ? [chatLimiter] : []), async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const convId = Number(req.params.conversationId);
      if (!convId || !Number.isInteger(convId) || convId <= 0) {
        return res.status(400).json({ error: "Invalid conversationId." });
      }

      const rawText = req.body?.text;
      if (typeof rawText !== "string" || rawText.trim().length === 0 || rawText.trim().length > 1000) {
        return res.status(400).json({ error: "Message must be 1–1000 non-whitespace characters." });
      }
      const cleanText = sanitizeText(rawText, 1000);
      if (!cleanText) {
        return res.status(400).json({ error: "Message must be 1–1000 non-whitespace characters." });
      }

      const conv = await prisma.conversation.findUnique({ where: { id: convId } });
      if (!conv) return res.status(404).json({ error: "Conversation not found." });
      if (!isParticipant(conv, req.user.id)) {
        return res.status(403).json({ error: "Only participants can send messages." });
      }
      if (isBlocked(conv)) {
        return res.status(409).json({
          error: conv.restrictedById !== null
            ? "Messaging is blocked: a restriction is in place."
            : "Messaging is blocked: a new invitation must be accepted first.",
        });
      }

      const [message] = await prisma.$transaction([
        prisma.conversationMessage.create({
          data: { conversationId: convId, senderId: req.user.id, text: cleanText },
        }),
        prisma.conversation.update({
          where: { id: convId },
          data: { updatedAt: now() },
        }),
      ]);

      return res.status(201).json({ message });
    } catch (err) {
      return next(err);
    }
  });

  // ── PATCH /api/chats/:conversationId/restrict — apply / remove restriction
  router.patch("/:conversationId/restrict", requireAuth, async (req, res, next) => {
    try {
      if (!(await ensureActiveCaller(req, res))) return;
      const convId = Number(req.params.conversationId);
      if (!convId || !Number.isInteger(convId) || convId <= 0) {
        return res.status(400).json({ error: "Invalid conversationId." });
      }
      const action = req.body?.action;
      if (!["apply", "remove"].includes(action)) {
        return res.status(400).json({ error: "action must be 'apply' or 'remove'." });
      }

      const conv = await prisma.conversation.findUnique({ where: { id: convId } });
      if (!conv) return res.status(404).json({ error: "Conversation not found." });
      if (!isParticipant(conv, req.user.id)) {
        return res.status(403).json({ error: "Only participants can manage restrictions." });
      }

      if (action === "apply") {
        if (conv.restrictedById !== null) {
          return res.status(409).json({ error: "A restriction is already in place." });
        }
        const updated = await prisma.conversation.update({
          where: { id: convId },
          data: { restrictedById: req.user.id, updatedAt: now() },
        });
        return res.json({ conversation: updated });
      }

      // remove
      if (conv.restrictedById === null) {
        return res.status(409).json({ error: "No restriction is currently in place." });
      }
      if (conv.restrictedById !== req.user.id) {
        return res.status(403).json({ error: "Only the user who applied the restriction can remove it." });
      }
      const updated = await prisma.conversation.update({
        where: { id: convId },
        data: { restrictedById: null, requiresReinvite: true, updatedAt: now() },
      });
      return res.json({ conversation: updated });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createChatsRouter;
