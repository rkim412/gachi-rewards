#!/usr/bin/env node
/**
 * Resolve failed Prisma migrations in production
 * This script marks failed migrations as rolled back so they can be reapplied
 */

import { execSync } from 'child_process';

const MIGRATION_NAME = '20250101000000_init_postgresql';

try {
  console.log(`Attempting to resolve failed migration: ${MIGRATION_NAME}`);
  
  // Try to mark the migration as rolled back
  // This will fail silently if the migration doesn't exist or isn't failed
  try {
    execSync(`npx prisma migrate resolve --rolled-back ${MIGRATION_NAME}`, {
      stdio: 'inherit',
      env: process.env,
    });
    console.log(`✅ Successfully marked migration ${MIGRATION_NAME} as rolled back`);
  } catch (error) {
    // Migration might not be in failed state, or might not exist
    // This is okay - we'll continue with migrate deploy
    console.log(`ℹ️  Migration ${MIGRATION_NAME} is not in a failed state (or doesn't exist)`);
    console.log(`   Continuing with migration deployment...`);
  }
  
  process.exit(0);
} catch (error) {
  console.error('Error resolving migration:', error.message);
  process.exit(1);
}

