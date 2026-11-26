const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { sanitizeUser } = require("../utils/serializers");
const { parsePositiveInt, sanitizeText } = require("../utils/validators");

function createChatsRouter(prisma) {
  const router = express.Router();

  // GET /api/chats — strictly scoped to threads the authenticated user participates in
  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const { archived } = req.query;
      const where = {
        OR: [{ donorId: req.user.id }, { recipientId: req.user.id }],
      };
      if (archived === "true") where.archived = true;
      if (archived === "false") where.archived = false;

      const threads = await prisma.chatThread.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          donor: true,
          request: true,
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      return res.json({
        count: threads.length,
        threads: threads.map((t) => ({
          ...t,
          donor: sanitizeUser(t.donor, { includePrivate: false }),
        })),
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/chats — open or retrieve thread (must be requester or invited donor)
  router.post("/", requireAuth, async (req, res, next) => {
    try {
      const requestId = parsePositiveInt(req.body?.requestId);
      const donorId = parsePositiveInt(req.body?.donorId);
      if (!requestId || !donorId) {
        return res.status(400).json({ error: "Valid requestId and donorId are required." });
      }
      const reqRecord = await prisma.bloodRequest.findUnique({ where: { id: requestId } });
      if (!reqRecord) {
        return res.status(404).json({ error: "Blood request not found." });
      }
      if (reqRecord.requesterId !== req.user.id && donorId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: you cannot open a chat for an unrelated request." });
      }

      const thread = await prisma.chatThread.upsert({
        where: { requestId_donorId: { requestId, donorId } },
        update: { archived: false },
        create: {
          requestId,
          donorId,
          recipientId: reqRecord.requesterId,
          hospital: reqRecord.hospital,
          statusTag: "Relay",
          messages: {
            create: {
              senderRole: "SYSTEM",
              text: `Relay opened for ${reqRecord.code}. Phone numbers remain shielded.`,
            },
          },
        },
        include: {
          donor: true,
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      return res.status(201).json({
        thread: { ...thread, donor: sanitizeUser(thread.donor, { includePrivate: false }) },
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/chats/:threadId/messages — participant only, senderRole derived server-side
  router.post("/:threadId/messages", requireAuth, async (req, res, next) => {
    try {
      const threadId = parsePositiveInt(req.params.threadId);
      if (!threadId) {
        return res.status(400).json({ error: "Invalid threadId." });
      }

      const cleanText = sanitizeText(req.body?.text, 1000);
      if (!cleanText) {
        return res.status(400).json({ error: "Non-empty message text is required." });
      }

      const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
      if (!thread) {
        return res.status(404).json({ error: "Chat thread not found." });
      }

      const isDonor = thread.donorId === req.user.id;
      const isRecipient = thread.recipientId === req.user.id;
      if (!isDonor && !isRecipient) {
        return res.status(403).json({ error: "Forbidden: you are not a participant in this conversation." });
      }

      const senderRole = isDonor ? "DONOR" : "RECIPIENT";

      const message = await prisma.chatMessage.create({
        data: {
          threadId,
          senderId: req.user.id,
          senderRole,
          text: cleanText,
        },
      });

      await prisma.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json({ message });
    } catch (err) {
      return next(err);
    }
  });

  // PATCH /api/chats/:threadId/archive — participant only
  router.patch("/:threadId/archive", requireAuth, async (req, res, next) => {
    try {
      const threadId = parsePositiveInt(req.params.threadId);
      if (!threadId) {
        return res.status(400).json({ error: "Invalid threadId." });
      }

      const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
      if (!thread) {
        return res.status(404).json({ error: "Chat thread not found." });
      }

      if (thread.donorId !== req.user.id && thread.recipientId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: only conversation participants can archive threads." });
      }

      const updated = await prisma.chatThread.update({
        where: { id: threadId },
        data: { archived: true },
      });

      return res.json({ thread: updated });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = createChatsRouter;
