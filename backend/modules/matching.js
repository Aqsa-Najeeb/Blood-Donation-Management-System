const { findLocation, LOCATIONS } = require("../data/locations");
const { haversineDistance } = require("../utils/distance");

/**
 * Find eligible donors for an emergency request:
 * - same declared blood group (no medical compatibility claims per BR-02)
 * - isDonor === true
 * - available === true
 * - not deactivated (deactivatedAt === null)
 * - not the request owner
 * - haversineDistance <= request.radius (inclusive)
 */
async function findMatchingDonors(prisma, request) {
  const reqLoc = findLocation(request.city, request.area) || LOCATIONS[0];

  const candidates = await prisma.user.findMany({
    where: {
      isDonor: true,
      available: true,
      deactivatedAt: null,
      bloodGroup: request.bloodGroup,
      id: { not: request.requesterId },
    },
  });

  const matches = [];
  for (const donor of candidates) {
    const donorLoc = findLocation(donor.city, donor.area) || LOCATIONS[0];
    const distance = haversineDistance(
      reqLoc.latitude,
      reqLoc.longitude,
      donorLoc.latitude,
      donorLoc.longitude
    );
    if (distance <= request.radius) {
      matches.push({ donor, distance });
    }
  }

  matches.sort((a, b) => a.distance - b.distance);
  return matches;
}

module.exports = {
  findMatchingDonors,
};
