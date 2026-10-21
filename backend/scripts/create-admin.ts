import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

async function main() {
  const email = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
  const name = process.env["ADMIN_NAME"]?.trim();
  const password = process.env["ADMIN_PASSWORD"];

  if (!email || !name || !password) {
    throw new Error(
      "Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD before running this script.",
    );
  }

  if (password.length < 12) {
    throw new Error("Administrator password must be at least 12 characters.");
  }

  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing from .env.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error(
        "A user with this email already exists. No account was changed.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.ADMINISTRATOR,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log("Administrator created successfully:");
    console.table(admin);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Administrator setup failed.",
  );
  process.exitCode = 1;
});