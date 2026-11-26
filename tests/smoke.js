const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");

// 1. Verify all required source, backend, Prisma, and Postman files exist and are non-empty
const requiredFiles = [
  "src/index.html",
  "src/find-donors.html",
  "src/input.css",
  "src/output.css",
  "src/js/store.js",
  "src/js/components.js",
  "src/js/pages-public.js",
  "src/js/pages-matching.js",
  "src/js/pages-dashboards.js",
  "src/js/pages-account.js",
  "src/js/main.js",
  "server.js",
  "backend/app.js",
  "backend/prisma.js",
  "backend/middleware/auth.js",
  "backend/middleware/rateLimit.js",
  "backend/utils/serializers.js",
  "backend/utils/validators.js",
  "backend/routes/auth.js",
  "backend/routes/donors.js",
  "backend/routes/requests.js",
  "backend/routes/donorActions.js",
  "backend/routes/chats.js",
  "backend/routes/settings.js",
  "prisma/schema.prisma",
  "prisma/seed.js",
  "postman/LifeLink-API.postman_collection.json",
  "postman/LifeLink-Local.postman_environment.json",
];

for (const rel of requiredFiles) {
  const full = path.join(root, rel);
  assert(fs.existsSync(full), `Missing file: ${rel}`);
  assert(fs.statSync(full).size > 0, `Empty file: ${rel}`);
}

// 2. Verify all referenced ./assets/*.svg exist and are non-empty, and zero temporary Figma URLs remain
const jsFiles = fs.readdirSync(path.join(srcDir, "js")).map((f) => path.join(srcDir, "js", f));
const referencedAssets = new Set();
for (const file of jsFiles) {
  const content = fs.readFileSync(file, "utf8");
  assert(!content.includes("figma.com/api/mcp/asset"), `Temporary Figma URL found in ${file}`);
  const matches = content.match(/\.\/assets\/[a-zA-Z0-9._-]+/g) || [];
  matches.forEach((m) => referencedAssets.add(m.replace("./assets/", "")));
}

assert(referencedAssets.size > 0, "Expected SVG asset references");
for (const asset of referencedAssets) {
  const assetPath = path.join(srcDir, "assets", asset);
  assert(fs.existsSync(assetPath), `Missing SVG asset: ${asset}`);
  assert(fs.statSync(assetPath).size > 0, `Empty SVG asset: ${asset}`);
}

// 3. Verify all 14 routes exist in main.js
const mainJs = fs.readFileSync(path.join(srcDir, "js", "main.js"), "utf8");
const expectedRoutes = [
  "/",
  "/find-donors",
  "/request-blood",
  "/donor-dashboard",
  "/recipient-dashboard",
  "/donor-profile",
  "/request-track",
  "/chat",
  "/how-it-works",
  "/about",
  "/safety-faqs",
  "/privacy-settings",
  "/login",
  "/signup",
];
for (const r of expectedRoutes) {
  assert(mainJs.includes(`case "${r}":`), `Missing route in main.js: ${r}`);
}

// 4. Verify Postman JSON parses cleanly
const postmanCol = JSON.parse(
  fs.readFileSync(path.join(root, "postman", "LifeLink-API.postman_collection.json"), "utf8")
);
assert(Array.isArray(postmanCol.item) && postmanCol.item.length >= 7, "Invalid Postman collection");

console.log(
  `All checks passed: ${requiredFiles.length} files, ${referencedAssets.size} SVG assets, ${expectedRoutes.length} routes, ${postmanCol.item.length} Postman folders.`
);
