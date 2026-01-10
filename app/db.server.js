// Prisma Client for PostgreSQL (production) or SQLite (local dev)
// Prisma 6: Simple PrismaClient instantiation - no adapters needed
import { PrismaClient } from "@prisma/client";

// Create Prisma client
// Prisma 6 automatically reads DATABASE_URL from environment variables
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

// Reuse client in development to avoid too many connections
// In production (serverless), each function invocation may create a new client
// Connection pooling is handled by Neon's connection pooler (via DATABASE_URL)
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
