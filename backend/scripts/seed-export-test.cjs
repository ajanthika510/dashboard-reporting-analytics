require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../dist/generated/prisma/client.js");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.$executeRawUnsafe(`
    DROP TABLE IF EXISTS "ReportExportLog", "ExportLog", "SavedReport", "Transaction", "ServiceTicket", "Ticket", "Staff", "UserBranch", "DashboardPreference", "User", "Branch", "_prisma_migrations" CASCADE;
    DROP TYPE IF EXISTS "UserRole", "TicketStatus", "TicketPriority", "TransactionType", "TransactionStatus", "ExportStatus", "ReportVisibility" CASCADE;
  `);
  console.log("Old tables and migrations dropped successfully.");
}

main()
  .catch((error) => {
    console.error("Drop failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

