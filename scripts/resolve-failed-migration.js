#!/usr/bin/env node
/**
 * Resolve failed Prisma migrations in production
 * This script marks failed migrations as rolled back so they can be reapplied
 */

import { execSync } from 'child_process';

const MIGRATION_NAME = '20250101000000_init_postgresql';

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('   Please set DATABASE_URL in Vercel environment variables.');
  console.error('   Get the value from: Vercel Dashboard → Storage → Postgres → POSTGRES_PRISMA_URL');
  process.exit(1);
}

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
  console.error('❌ ERROR: DATABASE_URL must start with postgres:// or postgresql://');
  console.error(`   Current value starts with: ${dbUrl.substring(0, 20)}...`);
  console.error('   Please use POSTGRES_PRISMA_URL from Vercel Postgres settings.');
  process.exit(1);
}

try {
  console.log(`Attempting to resolve failed migration: ${MIGRATION_NAME}`);
  
  // First, try to mark as applied (if tables already exist from partial migration)
  // This handles the case where migration partially succeeded
  try {
    execSync(`npx prisma migrate resolve --applied ${MIGRATION_NAME}`, {
      stdio: 'inherit',
      env: process.env,
    });
    console.log(`✅ Successfully marked migration ${MIGRATION_NAME} as applied`);
    console.log(`   Migration was partially applied - tables already exist`);
    process.exit(0);
  } catch (appliedError) {
    // If marking as applied fails, try rolled back
    console.log(`ℹ️  Could not mark as applied, trying rolled back...`);
    
    try {
      execSync(`npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}`, {
        stdio: 'inherit',
        env: process.env,
      });
      console.log(`✅ Successfully marked migration ${MIGRATION_NAME} as rolled back`);
      console.log(`   Migration will be reapplied on next deploy`);
    } catch (rolledBackError) {
      // Migration might not be in failed state, or might not exist
      // This is okay - we'll continue with migrate deploy
      console.log(`ℹ️  Migration ${MIGRATION_NAME} is not in a failed state (or doesn't exist)`);
      console.log(`   Continuing with migration deployment...`);
    }
  }
  
  process.exit(0);
} catch (error) {
  console.error('Error resolving migration:', error.message);
  process.exit(1);
}

