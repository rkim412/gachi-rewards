// Prisma Client for local development (SQLite)
// Note: Accelerate removed for local development - not needed for SQLite
// For production serverless environments, Accelerate can be added back if needed
import { PrismaClient } from "@prisma/client";

// Create Prisma client
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

// Reuse client in development to avoid too many connections
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
