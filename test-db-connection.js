// Test script to verify Neon database connection
import prisma from "./app/db.server.js";

async function testConnection() {
  try {
    console.log("🔌 Testing database connection...");
    
    // Test 1: Simple query to check connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful!");
    console.log("   Test query result:", result);
    
    // Test 2: Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log("\n📊 Tables in database:");
    if (tables.length === 0) {
      console.log("   ⚠️  No tables found. You need to run migrations first.");
      console.log("   Run: npx prisma migrate deploy");
    } else {
      tables.forEach((table) => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    // Test 3: Try a simple count query on Session table (if it exists)
    try {
      const sessionCount = await prisma.session.count();
      console.log(`\n📈 Session records: ${sessionCount}`);
    } catch (error) {
      if (error.code === "P2021") {
        console.log("\n⚠️  Session table doesn't exist yet. Run migrations.");
      } else {
        throw error;
      }
    }
    
    console.log("\n✅ All tests passed! Database is ready to use.");
    
  } catch (error) {
    console.error("\n❌ Database connection failed!");
    console.error("Error:", error.message);
    
    if (error.code === "P1001") {
      console.error("\n💡 Tip: Check your DATABASE_URL in .env file");
      console.error("   Make sure it's set to your Neon connection string");
    } else if (error.code === "P1000") {
      console.error("\n💡 Tip: Authentication failed. Check your database credentials.");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
