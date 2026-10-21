import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

async function main() {
  const email = "manager.test@neirahtech.com";
  const name = "RBAC Test Manager";
  const password = process.env["TEST_MANAGER_PASSWORD"];
  const connectionString = process.env["DATABASE_URL"];

  if (!password || password.length < 12) {
    throw new Error("Set TEST_MANAGER_PASSWORD to a password of at least 12 characters.");
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log("Test manager already exists; no changes made.");
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: UserRole.MANAGER,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    console.log("Test manager created:");
    console.table(user);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Setup failed.");
  process.exitCode = 1;
});