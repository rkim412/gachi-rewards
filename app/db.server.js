import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// Determine if we should use Accelerate (only for production PostgreSQL)
const useAccelerate = 
  process.env.NODE_ENV === "production" && 
  process.env.DATABASE_URL?.includes("postgres");

// Create Prisma client with or without Accelerate
const createPrismaClient = () => {
  if (useAccelerate) {
    return new PrismaClient().$extends(withAccelerate());
  }
  // For local SQLite, use regular Prisma Client (no Accelerate)
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
