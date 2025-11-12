// Quick test to verify DATABASE_URL format
import { config } from 'dotenv';
config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log('Connection string format check:');

// Check if it's a valid PostgreSQL connection string
if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  console.log('✅ Valid PostgreSQL connection string format');
  
  // Check if it's using SSL (recommended for production)
  if (dbUrl.includes('sslmode=require')) {
    console.log('✅ Has SSL parameter (recommended for production)');
  } else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.log('ℹ️  Local connection (SSL not required)');
  } else {
    console.log('⚠️  Production connection without SSL - consider adding ?sslmode=require');
  }
  
  // Check port
  if (dbUrl.includes(':5432')) {
    console.log('✅ Using standard PostgreSQL port (5432)');
  }
} else {
  console.log('❌ Invalid connection string format');
  console.log('   Must start with postgresql:// or postgres://');
  process.exit(1);
}

// Show first/last part of connection string (hide password)
const parts = dbUrl.split('@');
if (parts.length === 2) {
  const beforeAt = parts[0].substring(0, 20) + '...';
  const afterAt = parts[1];
  console.log('\nConnection string preview:');
  console.log(`${beforeAt}@${afterAt}`);
}


