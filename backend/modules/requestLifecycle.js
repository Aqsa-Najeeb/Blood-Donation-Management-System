const { now } = require("../utils/clock");

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function toPktDateString(date) {
  const pkt = new Date(date.getTime() + PKT_OFFSET_MS);
  const y = pkt.getUTCFullYear();
  const m = String(pkt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(pkt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns the exact expiry Date (11:59 PM PKT / 18:59:00 UTC) on the request's requiredDate.
 * @param {Date|string} requiredDate
 * @returns {Date}
 */
function getExpiryAt(requiredDate) {
  const dateStr = toPktDateString(new Date(requiredDate));
  return new Date(`${dateStr}T23:59:00+05:00`);
}

/**
 * Idempotently expires all OPEN requests whose 11:59 PM PKT expiry boundary has passed.
 * Notifies the owner and every previously notified donor once per request (no contact details).
 * @param {import("@prisma/client").PrismaClient} prisma
 * @returns {Promise<number>} count of newly expired requests
 */
async function expireDueRequests(prisma) {
  const { notify } = require("./notifications");
  const currentTime = now();

  const openRequests = await prisma.bloodRequest.findMany({
    where: { status: "OPEN" },
    include: {
      responses: {
        select: { donorId: true },
      },
    },
  });

  let expiredCount = 0;

  for (const req of openRequests) {
    const expiryAt = getExpiryAt(req.requiredDate);
    if (currentTime.getTime() < expiryAt.getTime()) {
      continue;
    }

    // Conditional update guarantees idempotency and single-notification even under concurrent calls
    const updated = await prisma.bloodRequest.updateMany({
      where: { id: req.id, status: "OPEN" },
      data: { status: "CLOSED", closureReason: "EXPIRED" },
    });

    if (updated.count === 0) {
      continue;
    }

    expiredCount += 1;

    await notify(req.requesterId, {
      type: "REQUEST_EXPIRED",
      title: `Request ${req.code} expired`,
      text: `Your ${req.bloodGroup} blood request at ${req.hospital} expired at 11:59 PM PKT.`,
      link: `/request-track?id=${req.code}`,
    });

    const notifiedDonorIds = [...new Set((req.responses || []).map((r) => r.donorId))];
    for (const donorId of notifiedDonorIds) {
      await notify(donorId, {
        type: "REQUEST_EXPIRED",
        title: `Request ${req.code} expired`,
        text: `The ${req.bloodGroup} blood request at ${req.hospital} has expired and is now closed.`,
        link: `/request-track?id=${req.code}`,
      });
    }
  }

  return expiredCount;
}

module.exports = {
  toPktDateString,
  getExpiryAt,
  expireDueRequests,
};
