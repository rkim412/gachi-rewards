// Prisma Client with Accelerate extension for connection pooling
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Create Prisma client with Accelerate extension
// Accelerate provides connection pooling and caching for serverless environments
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Extend client with Accelerate for connection pooling
  return client.$extends(withAccelerate());
};

// Reuse client in development to avoid too many connections
// In production (serverless), each function invocation may create a new client
// Accelerate handles connection pooling efficiently
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
