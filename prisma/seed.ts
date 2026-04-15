import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPw = await bcrypt.hash("admin123", 10);
  const agentPw = await bcrypt.hash("agent123", 10);
  const partnerPw = await bcrypt.hash("partner123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nestc.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@nestc.com",
      password: adminPw,
      role: "admin",
      company: "NESTC",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@nestc.com" },
    update: {},
    create: {
      name: "NESTC Agent",
      email: "agent@nestc.com",
      password: agentPw,
      role: "nestc_agent",
      company: "NESTC",
    },
  });

  const partner = await prisma.user.upsert({
    where: { email: "partner@abtalna.com" },
    update: {},
    create: {
      name: "Abtalna Partner",
      email: "partner@abtalna.com",
      password: partnerPw,
      role: "partner",
      company: "Abtalna",
    },
  });

  const sampleWorkers = [
    { firstName: "Mohamed", lastName: "Elsayed", middleName: "Essam", status: "in_progress", daysAgo: 23 },
    { firstName: "Marwan", lastName: "Nassar", middleName: null, status: "in_progress", daysAgo: 23 },
    { firstName: "Ahmed", lastName: "Elagami", middleName: null, status: "in_progress", daysAgo: 23 },
    { firstName: "Ayman", lastName: "Abdalhaj", middleName: null, status: "in_progress", daysAgo: 18 },
    { firstName: "Omar", lastName: "Aal", middleName: null, status: "pending_review", daysAgo: 15 },
    { firstName: "Alaa", lastName: "Shahin", middleName: null, status: "additional_info", daysAgo: 24 },
    { firstName: "Youssef", lastName: "Abrar", middleName: null, status: "completed", daysAgo: 40 },
  ];

  for (const worker of sampleWorkers) {
    const dateOfOrder = new Date();
    dateOfOrder.setDate(dateOfOrder.getDate() - worker.daysAgo);

    const n = Math.floor(10000000 + Math.random() * 90000000);
    const transId = `${n}-${n + Math.floor(Math.random() * 9999)}`;

    const existing = await prisma.transaction.findFirst({
      where: { firstName: worker.firstName, lastName: worker.lastName },
    });
    if (existing) continue;

    const tx = await prisma.transaction.create({
      data: {
        transId,
        firstName: worker.firstName,
        lastName: worker.lastName,
        middleName: worker.middleName,
        subjectType: "individual",
        inquiryType: "employment_screening",
        country: "Egypt",
        status: worker.status,
        source: true,
        dateOfOrder,
        createdById: partner.id,
        assignedToId: agent.id,
        components: {
          create: {
            type: "criminal_history_egypt",
            status: "in_progress",
            allocationStatus: "ICVendorNEI",
          },
        },
      },
      include: { components: true },
    });

    await prisma.actionHistory.createMany({
      data: [
        {
          transactionId: tx.id,
          componentId: tx.components[0]?.id,
          userId: partner.id,
          actionType: "Application submitted",
          actionNote: "The application is submitted and the TAT is 8 business days",
          actionTypeId: 38,
          visibility: "external",
          createdAt: dateOfOrder,
        },
        {
          transactionId: tx.id,
          componentId: tx.components[0]?.id,
          userId: agent.id,
          actionType: "Contact made",
          actionNote: "All cases ordered by other clients - will send the case to ICVendorNElshhkh.",
          actionTypeId: 54,
          visibility: "external",
          createdAt: new Date(dateOfOrder.getTime() + 60 * 60 * 1000),
        },
      ],
    });
  }

  // ── Sample Batches ───────────────────────────────────────────────────────
  const batchDefs = [
    {
      batchRef: "BTH-2026-001",
      source: "abtalna",
      status: "pending",
      priority: "high",
      daysAgo: 2,
      candidates: [
        { firstName: "Karim", lastName: "Hassan", nationalId: "29901150100123", phone: "01012345678", positionApplied: "Delivery Driver" },
        { firstName: "Mostafa", lastName: "Gamal", nationalId: "29811200200456", phone: "01098765432", positionApplied: "Warehouse Worker" },
        { firstName: "Tamer", lastName: "Lotfy", nationalId: "30003150300789", phone: "01154321987", positionApplied: "Field Technician" },
        { firstName: "Sherif", lastName: "Nasser", nationalId: "29706200401234", phone: "01234567890", positionApplied: "Delivery Driver" },
      ],
    },
    {
      batchRef: "BTH-2026-002",
      source: "wuzzuf",
      status: "processing",
      priority: "normal",
      daysAgo: 5,
      candidates: [
        { firstName: "Sara", lastName: "Ibrahim", nationalId: "30102150500567", phone: "01067891234", positionApplied: "Customer Service" },
        { firstName: "Nour", lastName: "Khaled", nationalId: "29904150600890", phone: "01187654321", positionApplied: "Cashier", score: "CLEAR", scoreNotes: "No criminal record found." },
        { firstName: "Ahmed", lastName: "Samir", nationalId: "29806150700123", phone: "01212345678", positionApplied: "Security Guard", score: "ADVERSE", scoreNotes: "Prior conviction record found — 2021 theft case." },
        { firstName: "Hany", lastName: "Farouk", nationalId: "30005150800456", phone: "01143214321", positionApplied: "Driver", score: "CONSIDER", scoreNotes: "Minor traffic violations recorded. Recommend client review." },
        { firstName: "Rania", lastName: "Mostafa", nationalId: "30207150900789", phone: "01298765432", positionApplied: "Office Assistant" },
      ],
    },
    {
      batchRef: "BTH-2026-003",
      source: "abtalna",
      status: "completed",
      priority: "normal",
      daysAgo: 14,
      candidates: [
        { firstName: "Mohamed", lastName: "Ali", nationalId: "29908151001234", phone: "01034567890", positionApplied: "Construction Worker", score: "CLEAR", scoreNotes: "Clean record." },
        { firstName: "Adel", lastName: "Wagdy", nationalId: "30101151101567", phone: "01156789012", positionApplied: "Plumber", score: "CLEAR", scoreNotes: "Clean record." },
        { firstName: "Fady", lastName: "Hanna", nationalId: "29803151201890", phone: "01278901234", positionApplied: "Electrician", score: "CONSIDER", scoreNotes: "Pending minor case from 2023, no conviction." },
      ],
    },
    {
      batchRef: "BTH-2026-004",
      source: "direct",
      status: "pending",
      priority: "low",
      daysAgo: 1,
      candidates: [
        { firstName: "Youssef", lastName: "Mansour", nationalId: "30104151301123", phone: "01090123456", positionApplied: "Store Manager" },
        { firstName: "Layla", lastName: "Ahmed", nationalId: "30306151401456", phone: "01212312312", positionApplied: "HR Coordinator" },
      ],
    },
  ];

  for (const def of batchDefs) {
    const existing = await prisma.batch.findUnique({ where: { batchRef: def.batchRef } });
    if (existing) continue;

    const submittedAt = new Date();
    submittedAt.setDate(submittedAt.getDate() - def.daysAgo);

    const scored = def.candidates.filter(c => c.score).length;

    await prisma.batch.create({
      data: {
        batchRef: def.batchRef,
        clientId: partner.id,
        assignedToId: agent.id,
        status: def.status,
        source: def.source,
        priority: def.priority,
        totalCount: def.candidates.length,
        processedCount: scored,
        submittedAt,
        completedAt: def.status === "completed" ? new Date() : null,
        webhookFired: def.status === "completed",
        webhookStatus: def.status === "completed" ? 200 : null,
        candidates: {
          create: def.candidates.map(c => ({
            firstName: c.firstName,
            lastName: c.lastName,
            nationalId: c.nationalId,
            phone: c.phone,
            positionApplied: c.positionApplied,
            score: c.score || null,
            scoreNotes: c.scoreNotes || null,
            scoredAt: c.score ? new Date() : null,
            scoredById: c.score ? agent.id : null,
          })),
        },
      },
    });
  }

  console.log("✅ Sample batches seeded (4 batches)");

  await prisma.notification.upsert({
    where: { id: "notif-ukraine" },
    update: {},
    create: {
      id: "notif-ukraine",
      title: "Service Delay: Criminal Certificates in Ukraine",
      body: "Due to frequent power outages, delays are expected for Criminal Certificate service.",
      country: "Ukraine",
      active: true,
    },
  });

  console.log("✅ Seeding complete!");
  console.log("  Admin: admin@nestc.com / admin123");
  console.log("  Agent: agent@nestc.com / agent123");
  console.log("  Partner: partner@abtalna.com / partner123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
