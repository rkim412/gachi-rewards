// Prisma Config - Configuration for Prisma CLI commands (migrations, generate, etc.)
// Uses DATABASE_URL (pooled connection) for both CLI and runtime
// Prisma CLI automatically loads .env files, so no imports needed
export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
}
