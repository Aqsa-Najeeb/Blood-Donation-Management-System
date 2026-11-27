# Known Issues & Gaps (Gate 5)

**Date:** 2026-11-27

1. **Legacy `tests/api.test.js` (`npm run test:api`) is outdated**:
   - `tests/api.test.js` targets the original pre-slice prototype schema (`role`, `newsletter`, `BloodRequest.patientName`/`stage`, `ChatThread.requestId`) and is not part of `npm run test:all`. Running `npm run test:api` directly will fail against the refactored schema.
2. **Legacy prototype UI views remain for secondary routes**:
   - Core slice routes (`/find-donors`, `/request-blood`, `/privacy-settings`, `/profile`, `/chat`) use the new API-backed pages (`SearchDonorsPage`, `RequestsPage`, `ProfilePage`, `ChatPage`).
   - Legacy routes (`/donor-dashboard`, `/recipient-dashboard`, `/donor-profile`, `/request-track`) still render prototype components from `pages-dashboards.js` and `pages-matching.js` backed by `INITIAL_*` fallback arrays in `store.js`.
3. **Postman collection is not updated for B1–B3 and C1–C3**:
   - `postman/LifeLink-API.postman_collection.json` still contains the prototype collection structure (smoke test only checks JSON validity and folder count).
4. **No automated headless-browser UI test suite**:
   - `npm run test:all` verifies static file/asset/route integrity (`tests/smoke.js`) and full API + DB + business rules (`tests/a1.test.js` – `tests/c3.test.js`). Interactive React rendering in `src/js/*.js` was not executed in a headless browser.
5. **Static location table (`backend/data/locations.js`)**:
   - Location matching supports 11 pre-configured areas in Lahore per Decision D6. Users or requests specifying unsupported cities/areas are rejected (`400`) until added to the static coordinates table.
