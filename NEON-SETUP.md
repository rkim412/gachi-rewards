# Neon Database Setup Guide

## ✅ Code Files Updated

The following files have been updated to use Neon PostgreSQL with Prisma 7:
- ✅ `app/db.server.js` - Updated for Prisma 7, passes DATABASE_URL to PrismaClient constructor
- ✅ `prisma/schema.prisma` - Changed to PostgreSQL provider (Prisma 7: no url in datasource)
- ✅ `prisma.config.ts` - Created for Prisma CLI commands (uses DIRECT_URL or DATABASE_URL)

## 🔧 Local Testing Setup

### Step 1: Add Database Connection Strings to .env file

Open your `.env` file and add both Neon connection strings:

```env
# Pooled connection (used by Prisma Client - your app)
# Get from: Neon Dashboard → Connection Details → Pooled connection
DATABASE_URL=postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Direct connection (used by Prisma CLI - migrations, generate, etc.)
# Get from: Neon Dashboard → Connection Details → Direct connection (non-pooled)
DIRECT_URL=postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important:** 
- `DATABASE_URL` uses the **pooled connection** (has `-pooler` in hostname) - for your app
- `DIRECT_URL` uses the **direct connection** (no `-pooler`) - for Prisma CLI commands

### Step 2: Run Database Migrations

This will create all your tables in the Neon database:

```bash
npx prisma migrate deploy
```

Or if you need to create a new migration:

```bash
npm run db:migrate
```

### Step 3: Test the Connection

Run the test script to verify everything works:

```bash
npm run db:test
```

This will:
- ✅ Test database connection
- ✅ List all tables
- ✅ Verify Prisma client works correctly

### Step 4: Verify Tables in Neon Dashboard

1. Go to https://console.neon.tech
2. Select your project
3. Click on "Tables" tab
4. You should see all your tables: `Session`, `StorefrontUser`, `ReferralDiscountCode`, etc.

## 🚀 Production Deployment

### Vercel Environment Variables

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add/Update `DATABASE_URL`:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
3. Add `DIRECT_URL` (optional but recommended for faster migrations):
   - **Key:** `DIRECT_URL`
   - **Value:** `postgresql://neondb_owner:npg_Gg0BQwFnfKs5@ep-noisy-block-ahcrdwdt.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - **Note:** This is used by Prisma CLI commands (migrations, generate) via `prisma.config.ts`

### Deploy

```bash
git add .
git commit -m "Switch to Neon PostgreSQL, remove Prisma Accelerate"
git push
```

Vercel will automatically:
- Run `npm run setup:prod` which includes `prisma migrate deploy`
- Create all tables in your Neon database

## 🔄 Switching Between SQLite (Local) and PostgreSQL (Production)

### For Local SQLite Testing

If you want to use SQLite locally instead of Neon:

1. Temporarily change `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.sqlite"
   }
   ```

2. Regenerate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

### For Production PostgreSQL (Neon)

Use the PostgreSQL configuration (already set):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🐛 Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` in `.env` file
- Make sure you're using the **pooled connection string** (with `-pooler` in hostname)
- Verify your Neon project is active in the dashboard

### "Migration failed"
- Make sure `DATABASE_URL` is set correctly
- Check Neon dashboard to ensure database is running
- Try running: `npx prisma migrate deploy --schema=./prisma/schema.prisma`

### "Table does not exist"
- Run migrations: `npx prisma migrate deploy`
- Check Neon dashboard → Tables tab to verify tables were created

### Connection Timeout
- Make sure you're using the pooled connection string
- Check that `connect_timeout=15` is in your connection string
- Verify your internet connection

## 📊 Useful Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npx prisma migrate deploy

# Test database connection
npm run db:test

# Open Prisma Studio (database GUI)
npm run db:studio

# View database in Neon dashboard
# Go to: https://console.neon.tech → Your Project → Tables
```

## ✅ Checklist

- [ ] Added `DATABASE_URL` to `.env` file
- [ ] Ran `npx prisma migrate deploy` successfully
- [ ] Ran `npm run db:test` - all tests passed
- [ ] Verified tables exist in Neon dashboard
- [ ] Set `DATABASE_URL` in Vercel environment variables
- [ ] Removed `DIRECT_DATABASE_URL` from Vercel (if it existed)
- [ ] Deployed to Vercel successfully

---

**Need help?** Check the Neon dashboard or Prisma logs for detailed error messages.
