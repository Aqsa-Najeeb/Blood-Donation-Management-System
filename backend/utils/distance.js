let distanceOverride = null;

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers rounded to 1 decimal place
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (distanceOverride !== null) {
    return distanceOverride;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function setDistanceOverride(dist) {
  distanceOverride = dist === null || dist === undefined ? null : Number(dist);
}

module.exports = {
  haversineDistance,
  setDistanceOverride,
};
