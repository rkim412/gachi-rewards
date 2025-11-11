# Quick Start: Vercel Postgres Setup

## 🚀 Fastest Path to Get Running

### 1. Create Vercel Postgres Database

**Via Dashboard:**
1. Go to https://vercel.com/dashboard
2. Create/select your project
3. Go to **Storage** tab → **Create Database** → **Postgres**
4. Choose **Hobby** (free) plan
5. Select region → **Create**

**Via CLI:**
```bash
vercel postgres create gachi-rewards-db
```

### 2. Get Connection String

**Via Dashboard:**
- Storage → Your DB → Settings → Copy `POSTGRES_PRISMA_URL`

**Via CLI:**
```bash
vercel postgres env pull .env.local
# Then copy POSTGRES_PRISMA_URL to DATABASE_URL
```

### 3. Update .env File

```env
# Use the Prisma-optimized connection string
DATABASE_URL=postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15
```

**Important:** Use `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`) - it has connection pooling.

### 4. Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 5. Deploy to Vercel

```bash
# Deploy
vercel deploy

# Migrations run automatically via "setup" script
```

## 📋 Environment Variables in Vercel

After creating Postgres, Vercel automatically provides:
- `POSTGRES_URL` - Standard connection
- `POSTGRES_PRISMA_URL` - Prisma-optimized (use this!)
- `POSTGRES_URL_NON_POOLING` - Direct connection

**Set in Vercel Dashboard:**
1. Project → Settings → Environment Variables
2. Add: `DATABASE_URL` = `$POSTGRES_PRISMA_URL`
3. Select all environments (Production, Preview, Development)

## ✅ Verify It Works

```bash
# Test connection
npx prisma db pull

# View data
npm run db:studio
```

## 🎯 That's It!

Your app is now using Vercel Postgres. The `setup` script in `package.json` will automatically run migrations on each deploy.

