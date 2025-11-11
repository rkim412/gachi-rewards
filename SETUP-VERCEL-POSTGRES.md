# Setting Up Vercel Postgres for Gachi Rewards

## Step-by-Step Guide

### Step 1: Create Vercel Account (if needed)
1. Go to https://vercel.com
2. Sign up or log in with GitHub/GitLab/Bitbucket

### Step 2: Create a New Project
1. Click "Add New" → "Project"
2. Import your `gachi-rewards` repository (or create new project)
3. Don't deploy yet - we'll set up the database first

### Step 3: Create Vercel Postgres Database

#### Option A: Via Vercel Dashboard
1. Go to your project dashboard
2. Click on the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a plan:
   - **Hobby** (Free): 256 MB storage, good for development
   - **Pro**: For production with more storage
6. Select a region (closest to your users)
7. Click **Create**

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Create Postgres database
vercel postgres create gachi-rewards-db
```

### Step 4: Get Connection String

#### Via Dashboard:
1. Go to your project → **Storage** tab
2. Click on your Postgres database
3. Go to **Settings** tab
4. Find **Connection String** section
5. Copy the connection string (it looks like):
   ```
   postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
   ```

#### Via CLI:
```bash
# List your databases
vercel postgres ls

# Get connection string
vercel postgres env pull .env.local
```

### Step 5: Update Environment Variables

#### In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste your connection string
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

#### Locally:
1. Update your `.env` file:
   ```env
   DATABASE_URL=postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
   ```

### Step 6: Run Migrations

#### Locally (for testing):
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

#### In Vercel (after deployment):
```bash
# Deploy your app
vercel deploy

# Run migrations in production
vercel env pull .env.production
npx prisma migrate deploy
```

Or add to your `package.json`:
```json
{
  "scripts": {
    "setup": "prisma generate && prisma migrate deploy"
  }
}
```

Then Vercel will run `npm run setup` automatically on deploy.

### Step 7: Verify Connection

```bash
# Test connection
npx prisma db pull

# Open Prisma Studio to view data
npx prisma studio
```

## Important Notes

### Environment Variables in Vercel
- Vercel automatically injects `POSTGRES_URL` and `POSTGRES_PRISMA_URL`
- You can use either, but `POSTGRES_PRISMA_URL` is optimized for Prisma
- Update your `.env` to use the Prisma URL:
  ```
  DATABASE_URL=$POSTGRES_PRISMA_URL
  ```

### Connection String Format
Vercel provides two connection strings:
1. **POSTGRES_URL**: Standard connection (for raw SQL)
2. **POSTGRES_PRISMA_URL**: Prisma-optimized (with connection pooling)

Use `POSTGRES_PRISMA_URL` for Prisma.

### Security
- Never commit `.env` files to git
- Vercel automatically secures environment variables
- Connection strings are encrypted in transit

### Migration Strategy

#### Development:
```bash
# Local development
npx prisma migrate dev

# This creates migration files in prisma/migrations/
```

#### Production:
```bash
# Deploy to Vercel
vercel deploy

# Run migrations (Vercel will run setup script)
# OR manually:
vercel env pull .env.production
npx prisma migrate deploy
```

## Troubleshooting

### Connection Issues
- Check that your IP is allowed (Vercel Postgres allows all IPs by default)
- Verify connection string is correct
- Check database is not paused (Hobby plan pauses after inactivity)

### Migration Issues
- Make sure `DATABASE_URL` is set correctly
- Run `npx prisma generate` before migrations
- Check Prisma schema matches your database

### Vercel Deployment Issues
- Ensure `DATABASE_URL` is in Environment Variables
- Check build logs for Prisma errors
- Verify `setup` script runs migrations

## Quick Start Commands

```bash
# 1. Create database (via dashboard or CLI)
vercel postgres create gachi-rewards-db

# 2. Get connection string
vercel postgres env pull .env.local

# 3. Update .env
# Copy POSTGRES_PRISMA_URL to DATABASE_URL

# 4. Run migrations
npx prisma generate
npx prisma migrate dev

# 5. Deploy
vercel deploy
```

## Cost Information

- **Hobby (Free)**: 256 MB storage, 60 hours compute/month
- **Pro**: $20/month, 10 GB storage, unlimited compute
- **Enterprise**: Custom pricing

For development and small apps, Hobby tier is usually sufficient.

