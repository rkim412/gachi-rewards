// Use regular PrismaClient (not edge client)
// Edge client is only needed for edge runtime environments
import { PrismaClient } from "@prisma/client";

// Create Prisma client for PostgreSQL (production) or SQLite (local dev)
// Connection pooling is handled by Neon's built-in connection pooler
// Prisma 7: Connection URL is passed to PrismaClient constructor
const createPrismaClient = () => {
  return new PrismaClient({
    // Prisma 7: Pass connection string directly to constructor
    // Uses DATABASE_URL (pooled connection) for optimal serverless performance
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

// Reuse client in development to avoid too many connections
// In production (serverless), each function invocation may create a new client
// Connection pooling via Neon's pooler handles this efficiently
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
