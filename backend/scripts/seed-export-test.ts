import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from the backend .env file.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const branchId = "25e2baeb-200a-41d8-97b2-39a671fcf462";
const ticketNumber = "TEST-EXPORT-20261015-001";
const transactionReference = "TEST-EXPORT-20261015-SALE-001";

async function main() {
  await prisma.$connect();

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true, isActive: true },
  });

  if (!branch) {
    throw new Error("The expected Head Office branch was not found.");
  }

  if (!branch.isActive) {
    throw new Error("The Head Office branch is inactive. No test data inserted.");
  }

  await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.upsert({
      where: { ticketNumber },
      update: {
        title: "CSV Export Test Ticket",
        description: "Temporary test record for export verification",
        status: "OPEN",
        priority: "HIGH",
        amount: "1250.00",
        branchId,
      },
      create: {
        id: "7c93b6a1-2c41-4d78-9f21-6a5b8c0d1001",
        ticketNumber,
        title: "CSV Export Test Ticket",
        description: "Temporary test record for export verification",
        status: "OPEN",
        priority: "HIGH",
        amount: "1250.00",
        branchId,
      },
    });

    const transaction = await tx.transaction.upsert({
      where: { reference: transactionReference },
      update: {
        type: "SALE",
        status: "COMPLETED",
        amount: "1250.00",
        currency: "LKR",
        description: "Temporary CSV export test sale",
        branchId,
        ticketId: ticket.id,
      },
      create: {
        id: "7c93b6a1-2c41-4d78-9f21-6a5b8c0d1002",
        reference: transactionReference,
        type: "SALE",
        status: "COMPLETED",
        amount: "1250.00",
        currency: "LKR",
        description: "Temporary CSV export test sale",
        branchId,
        ticketId: ticket.id,
      },
    });

    console.log("Test ticket:", ticket.ticketNumber);
    console.log("Test transaction:", transaction.reference);
    console.log("Branch:", branch.name);
    console.log("Transaction amount: LKR 1,250.00");
  });
}

main()
  .catch((error: unknown) => {
    console.error("Test-data seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
