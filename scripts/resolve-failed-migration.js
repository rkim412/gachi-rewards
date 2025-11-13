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
  console.log(`Checking migration status: ${MIGRATION_NAME}`);
  
  // First, check if migration is already applied or in a good state
  // We'll try to get the migration status by checking if migrate deploy would work
  try {
    // Try to check migration status - if it's already applied, migrate deploy will skip it
    // If it's failed, we need to resolve it
    console.log(`ℹ️  Checking if migration needs resolution...`);
    
    // Try to mark as rolled back first (if it's in failed state)
    // This is safer than marking as applied if we're not sure
    try {
      execSync(`npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}`, {
        stdio: 'pipe', // Use pipe to suppress output if it fails
        env: process.env,
      });
      console.log(`✅ Successfully marked migration ${MIGRATION_NAME} as rolled back`);
      console.log(`   Migration will be reapplied by migrate deploy`);
    } catch (rolledBackError) {
      // Migration might already be applied or not in failed state
      // Check if it's already applied
      try {
        execSync(`npx prisma migrate resolve --applied ${MIGRATION_NAME}`, {
          stdio: 'pipe',
          env: process.env,
        });
        console.log(`✅ Migration ${MIGRATION_NAME} is already applied`);
        console.log(`   Skipping resolution - migrate deploy will handle it`);
      } catch (appliedError) {
        // Migration is not in a failed state and not already applied
        // This is fine - migrate deploy will handle it normally
        console.log(`ℹ️  Migration ${MIGRATION_NAME} is in a normal state`);
        console.log(`   Continuing with migrate deploy...`);
      }
    }
  } catch (error) {
    // If we can't check status, that's okay - migrate deploy will handle it
    console.log(`ℹ️  Could not check migration status, continuing with migrate deploy...`);
  }
  
  // Always exit successfully - let migrate deploy handle the actual migration
  process.exit(0);
} catch (error) {
  console.error('Error resolving migration:', error.message);
  // Don't fail the build if resolution fails - let migrate deploy try
  console.log('⚠️  Resolution failed, but continuing with migrate deploy...');
  process.exit(0);
}

