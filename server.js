require("dotenv").config();
const prisma = require("./backend/prisma");
const createApp = require("./backend/app");

const PORT = process.env.PORT || 3000;
const app = createApp(prisma);

app.listen(PORT, () => {
  console.log(`Life Link Express REST API + Web Server running at http://localhost:${PORT}`);
});
