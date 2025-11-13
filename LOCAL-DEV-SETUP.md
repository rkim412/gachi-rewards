# Local Development Setup

## Database Configuration

The production schema (`prisma/schema.prisma`) is configured for PostgreSQL. For local development with SQLite, you have two options:

### Option 1: Use SQLite (Easiest - No Database Server Needed)

**Temporarily modify `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.sqlite"
}
```

**Then run:**
```bash
npm run db:migrate
```

**Note**: Remember to change it back to PostgreSQL before committing if you're working on production features.

### Option 2: Use PostgreSQL Locally (Matches Production)

**Keep `prisma/schema.prisma` as-is (PostgreSQL)**

**Set up local PostgreSQL:**
1. Install PostgreSQL locally
2. Create a database: `createdb gachi_rewards_dev`
3. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/gachi_rewards_dev
   ```

**Then run:**
```bash
npm run db:migrate
```

---

## Quick Reference

### For SQLite Development:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.sqlite"
}
```

### For PostgreSQL (Production/Production-like):
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Environment Variables for Local Dev

Create `.env` file:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL=file:./dev.sqlite  # For SQLite
# OR
# DATABASE_URL=postgresql://postgres:password@localhost:5432/gachi_rewards_dev  # For PostgreSQL
NODE_ENV=development
```

---

## Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Open database viewer
npm run db:studio

# Start dev server
npm run dev
```

