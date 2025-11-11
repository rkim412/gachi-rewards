# PostgreSQL Setup Guide

## Quick Setup Options

### Option 1: Local PostgreSQL (if installed)

1. Create database:
```bash
createdb gachi_rewards
# OR using psql:
psql -U postgres -c "CREATE DATABASE gachi_rewards;"
```

2. Update `.env`:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/gachi_rewards
```

3. Run migration:
```bash
npx prisma migrate dev
```

### Option 2: Docker PostgreSQL (Recommended for local dev)

1. Run PostgreSQL in Docker:
```bash
docker run --name gachi-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gachi_rewards -p 5432:5432 -d postgres:15
```

2. Update `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gachi_rewards
```

3. Run migration:
```bash
npx prisma migrate dev
```

### Option 3: Cloud PostgreSQL (Production)

#### Vercel Postgres
1. Create Postgres database in Vercel dashboard
2. Copy connection string
3. Add to `.env`:
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

#### Supabase (Free tier available)
1. Create project at https://supabase.com
2. Go to Settings > Database
3. Copy connection string
4. Add to `.env`

#### Neon (Free tier available)
1. Create database at https://neon.tech
2. Copy connection string
3. Add to `.env`

## Migration Commands

After setting up PostgreSQL:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Or for production
npx prisma migrate deploy
```

## Verify Connection

```bash
# Test connection
npx prisma db pull

# Open Prisma Studio to view data
npx prisma studio
```

## Current Configuration

- **Provider**: PostgreSQL
- **Schema**: `prisma/schema.prisma`
- **Connection**: Set via `DATABASE_URL` environment variable

Make sure to update `.env` with your actual PostgreSQL connection string before running migrations!

