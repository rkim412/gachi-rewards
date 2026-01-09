// Script to fix .env file with correct DATABASE_URL format
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
const neonUrl = 'postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';

try {
  let content;
  
  if (existsSync(envPath)) {
    console.log('📝 Found .env file, updating DATABASE_URL...');
    content = readFileSync(envPath, 'utf8');
    
    // Remove quotes from DATABASE_URL if present
    content = content.replace(/DATABASE_URL=["']([^"']+)["']/g, 'DATABASE_URL=$1');
    
    // Remove spaces around = sign
    content = content.replace(/DATABASE_URL\s*=\s*/g, 'DATABASE_URL=');
    
    // Replace or add DATABASE_URL
    if (content.includes('DATABASE_URL=')) {
      // Replace existing
      content = content.replace(/DATABASE_URL=[^\r\n]+/g, `DATABASE_URL=${neonUrl}`);
      console.log('✅ Updated existing DATABASE_URL');
    } else {
      // Add if missing
      content += `\n# Database - Neon PostgreSQL\nDATABASE_URL=${neonUrl}\n`;
      console.log('✅ Added DATABASE_URL');
    }
  } else {
    console.log('📝 .env file not found. Creating new one...');
    content = `# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here

# App URL
SHOPIFY_APP_URL=https://gachi-rewards.vercel.app

# Scopes
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy

# Database - Neon PostgreSQL
DATABASE_URL=${neonUrl}

# Webhook Secret (Optional)
WEBHOOK_SECRET=your_webhook_secret_here

# Node Environment
NODE_ENV=development
`;
  }
  
  // Write back to file
  writeFileSync(envPath, content, 'utf8');
  
  console.log('✅ .env file fixed successfully!');
  console.log('\n📋 Verifying DATABASE_URL format...');
  
  // Verify
  const lines = content.split('\n');
  const dbLine = lines.find(line => line.startsWith('DATABASE_URL='));
  if (dbLine) {
    console.log(`   ${dbLine}`);
    if (dbLine.startsWith('DATABASE_URL=postgresql://')) {
      console.log('✅ Format is correct!');
    } else {
      console.log('⚠️  Format might still be incorrect');
    }
  }
  
  console.log('\n🚀 You can now run: npx prisma migrate deploy');
  
} catch (error) {
  console.error('❌ Error fixing .env file:', error.message);
  process.exit(1);
}
