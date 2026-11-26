// Static table of approximately 12 key Lahore city/area coordinates derived from platform seed data
const LOCATIONS = [
  { city: "Lahore", area: "Model Town", latitude: 31.4828, longitude: 74.3182 },
  { city: "Lahore", area: "Model Town & Surrounds", latitude: 31.4828, longitude: 74.3182 },
  { city: "Lahore", area: "Gulberg III", latitude: 31.5115, longitude: 74.3444 },
  { city: "Lahore", area: "DHA Phase 5", latitude: 31.4589, longitude: 74.4042 },
  { city: "Lahore", area: "DHA Phase 3", latitude: 31.4746, longitude: 74.3821 },
  { city: "Lahore", area: "Johar Town Phase 2", latitude: 31.4697, longitude: 74.2728 },
  { city: "Lahore", area: "Faisal Town", latitude: 31.4925, longitude: 74.3012 },
  { city: "Lahore", area: "Wapda Town", latitude: 31.4332, longitude: 74.2641 },
  { city: "Lahore", area: "Garden Town", latitude: 31.5034, longitude: 74.3267 },
  { city: "Lahore", area: "Shadman", latitude: 31.5368, longitude: 74.3275 },
  { city: "Lahore", area: "Allama Iqbal Town", latitude: 31.5126, longitude: 74.2814 },
  { city: "Lahore", area: "Cavalry Ground", latitude: 31.5002, longitude: 74.3689 },
];

function findLocation(city, area) {
  if (!city && !area) return null;
  const cleanCity = String(city || "").trim().toLowerCase();
  const cleanArea = String(area || "").trim().toLowerCase();

  return (
    LOCATIONS.find(
      (l) =>
        l.city.toLowerCase() === cleanCity &&
        (l.area.toLowerCase() === cleanArea || cleanArea.includes(l.area.toLowerCase()))
    ) ||
    LOCATIONS.find((l) => l.area.toLowerCase() === cleanArea) ||
    LOCATIONS.find((l) => l.city.toLowerCase() === cleanCity) ||
    null
  );
}

module.exports = {
  LOCATIONS,
  findLocation,
};
