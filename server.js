require("dotenv").config();
const prisma = require("./backend/prisma");
const createApp = require("./backend/app");
const { expireDueRequests } = require("./backend/modules/requestLifecycle");

const PORT = process.env.PORT || 3000;
const app = createApp(prisma);

// Run expiry sweep once at startup and every 60 seconds (Decision D2)
expireDueRequests(prisma).catch((err) => {
  console.error("[Expiry Sweep Startup Error]", err);
});
setInterval(() => {
  expireDueRequests(prisma).catch((err) => {
    console.error("[Expiry Sweep Error]", err);
  });
}, 60_000);

app.listen(PORT, () => {
  console.log(`Life Link Express REST API + Web Server running at http://localhost:${PORT}`);
});
