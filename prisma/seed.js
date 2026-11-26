require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("LifeLink@2026", 10);

  const donorsData = [
    {
      name: "Hamza Tariq",
      username: "hamza.tariq",
      email: "hamza.tariq@lifelink.pk",
      phone: "+92 300 1110001",
      isDonor: true,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Gulberg III",
      shortArea: "Gulberg",
      distanceKm: 3.2,
      donorIdCode: "#LL-9001",
      available: true,
      online: true,
      seenLabel: "Available Now",
      replyLabel: "< 15 mins",
    },
    {
      name: "Zainab Fatima",
      username: "zainab.fatima",
      email: "zainab.fatima@lifelink.pk",
      phone: "+92 300 1110002",
      isDonor: true,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Model Town",
      shortArea: "Model Town",
      distanceKm: 4.8,
      donorIdCode: "#LL-9002",
      available: true,
      online: true,
      seenLabel: "Available Now",
      replyLabel: "< 20 mins",
    },
    {
      name: "Bilal Ahmed",
      username: "bilal.ahmed",
      email: "bilal.ahmed@lifelink.pk",
      phone: "+92 300 1110003",
      isDonor: true,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Garden Town",
      shortArea: "Garden Town",
      distanceKm: 6.1,
      donorIdCode: "#LL-9003",
      available: false,
      online: false,
      seenLabel: "Active 45m ago",
      replyLabel: "< 30 mins",
    },
    {
      name: "Nadia Hussain",
      username: "nadia.hussain",
      email: "nadia.hussain@lifelink.pk",
      phone: "+92 301 2220001",
      isDonor: true,
      bloodGroup: "A+",
      city: "Lahore",
      area: "DHA Phase 5",
      shortArea: "DHA 5",
      distanceKm: 8.3,
      donorIdCode: "#LL-9004",
      available: true,
      online: true,
      seenLabel: "Available Now",
      replyLabel: "< 25 mins",
    },
    {
      name: "Omar Khalid",
      username: "omar.khalid",
      email: "omar.khalid@lifelink.pk",
      phone: "+92 301 2220002",
      isDonor: true,
      bloodGroup: "B+",
      city: "Lahore",
      area: "Johar Town Phase 2",
      shortArea: "Johar Town",
      distanceKm: 11.4,
      donorIdCode: "#LL-9005",
      available: true,
      online: false,
      seenLabel: "Active 2h ago",
      replyLabel: "< 1 hour",
    },
    {
      name: "Ayesha Khan",
      username: "ayesha.khan",
      email: "ayesha.khan@lifelink.pk",
      phone: "+92 302 3330001",
      isDonor: true,
      bloodGroup: "AB+",
      city: "Lahore",
      area: "Shadman",
      shortArea: "Shadman",
      distanceKm: 2.9,
      donorIdCode: "#LL-9006",
      available: true,
      online: true,
      seenLabel: "Available Now",
      replyLabel: "< 15 mins",
    },
    {
      name: "Tariq Mehmood",
      username: "tariq.mehmood",
      email: "tariq.mehmood@lifelink.pk",
      phone: "+92 302 3330002",
      isDonor: true,
      bloodGroup: "O-",
      city: "Lahore",
      area: "Allama Iqbal Town",
      shortArea: "Iqbal Town",
      distanceKm: 9.7,
      donorIdCode: "#LL-9007",
      available: false,
      online: false,
      seenLabel: "Active yesterday",
      replyLabel: "< 1 hour",
    },
  ];

  console.log("Clearing existing data...");
  await prisma.safetyReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.requestInvitation.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const createdUsers = [];
  for (const d of donorsData) {
    const user = await prisma.user.create({
      data: {
        ...d,
        passwordHash,
        matchingRadiusKm: 10,
        safetyFlags: 0,
        strictPhoneShielding: true,
      },
    });
    createdUsers.push(user);
    console.log(`  Created: ${user.name} (${user.email})`);
  }

  // Seed one requester-only user (not a donor)
  const requester = await prisma.user.create({
    data: {
      name: "Sara Aslam",
      username: "sara.aslam",
      email: "sara.aslam@lifelink.pk",
      phone: "+92 303 4440001",
      passwordHash,
      isDonor: false,
      bloodGroup: "O+",
      city: "Lahore",
      area: "Cavalry Ground",
      shortArea: "Cavalry Ground",
      distanceKm: 5.0,
      donorIdCode: null,
      available: false,
      online: true,
      seenLabel: "Available Now",
      replyLabel: "< 15 mins",
      matchingRadiusKm: 10,
      safetyFlags: 0,
      strictPhoneShielding: true,
    },
  });
  console.log(`  Created requester: ${requester.name} (${requester.email})`);

  console.log(`\nSeed complete. ${createdUsers.length + 1} users created.`);
  console.log("Credentials: email=<email above>, password=LifeLink@2026");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
