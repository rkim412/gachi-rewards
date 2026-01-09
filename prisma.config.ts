// Prisma Config - Configuration for Prisma CLI commands (migrations, generate, etc.)
// Uses DIRECT_URL for faster CLI operations, falls back to DATABASE_URL if not set
// Prisma Client (your app) uses DATABASE_URL passed to constructor in app/db.server.js
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Use DIRECT_URL if available (faster for CLI), otherwise use DATABASE_URL
const cliUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!cliUrl) {
  throw new Error('Either DIRECT_URL or DATABASE_URL must be set in environment variables');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: cliUrl,
  },
})
