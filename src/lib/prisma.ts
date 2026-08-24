import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Garante que o Next.js e o Prisma acessem SEMPRE o arquivo absoluto /prisma/dev.db
const dbAbsolutePath = path.join(process.cwd(), "prisma", "dev.db");
const dbUrl = `file:${dbAbsolutePath}`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
