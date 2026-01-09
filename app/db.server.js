// Use regular PrismaClient (not edge client)
// Edge client is only needed for edge runtime environments
import { PrismaClient } from "@prisma/client";

// Create Prisma client for PostgreSQL (production) or SQLite (local dev)
// Connection pooling is handled by Neon's built-in connection pooler
// Prisma 7: Prisma Client automatically reads DATABASE_URL from environment variables
const createPrismaClient = () => {
  return new PrismaClient({
    // Prisma 7: DATABASE_URL is automatically read from environment variables
    // No need to pass it explicitly to the constructor
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
