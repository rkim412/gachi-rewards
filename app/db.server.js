// Use regular PrismaClient (not edge client)
// Edge client is only needed for edge runtime environments
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Determine if we should use Accelerate (true when DATABASE_URL starts with prisma://)
// With Prisma Accelerate enabled, DATABASE_URL=prisma://… and DIRECT_DATABASE_URL provides raw Postgres connection
const useAccelerate = 
  process.env.NODE_ENV === "production" && 
  process.env.DATABASE_URL?.startsWith("prisma://");

// Create Prisma client with or without Accelerate
// Note: We use regular PrismaClient (not edge) for local SQLite compatibility
const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  
  if (useAccelerate) {
    // For production PostgreSQL with Accelerate, extend with Accelerate
    return baseClient.$extends(withAccelerate());
  }
  
  // For local SQLite, return regular client (no Accelerate)
  return baseClient;
};

// Reuse client in development to avoid too many connections
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
