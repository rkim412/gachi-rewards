// Use regular PrismaClient (not edge client)
// Edge client is only needed for edge runtime environments
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket for environments lacking built-in support (e.g., Vercel serverless)
neonConfig.webSocketConstructor = ws;



// Create Prisma client for PostgreSQL (production) or SQLite (local dev)
// Connection pooling is handled by Neon's built-in connection pooler
// Prisma 7: Requires a driver adapter when using engine type "client"
const createPrismaClient = () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60c012cc-d459-4e97-97d9-14bc07e6255d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.server.js:18',message:'Creating PrismaClient',data:{hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlLength:process.env.DATABASE_URL?.length||0,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const databaseUrl = process.env.DATABASE_URL;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60c012cc-d459-4e97-97d9-14bc07e6255d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.server.js:23',message:'DATABASE_URL check',data:{databaseUrlExists:!!databaseUrl,databaseUrlPrefix:databaseUrl?.substring(0,20)||'missing'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create Neon serverless connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  // Create Prisma adapter for Neon (serverless-optimized)
  const adapter = new PrismaNeon(pool);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60c012cc-d459-4e97-97d9-14bc07e6255d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.server.js:35',message:'Adapter created',data:{adapterType:adapter?.constructor?.name||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  return new PrismaClient({
    adapter,
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

// #region agent log
fetch('http://127.0.0.1:7242/ingest/60c012cc-d459-4e97-97d9-14bc07e6255d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.server.js:50',message:'PrismaClient exported',data:{isGlobal:!!global.prismaGlobal,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

export default prisma;
