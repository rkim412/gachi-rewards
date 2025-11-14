# Fix: DATABASE_URL Error in Vercel

## Error Message

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

## Root Cause

The `DATABASE_URL` environment variable is **not set** or **invalid** in your Vercel project. Prisma requires this to validate the schema during build.

## Solution: Set DATABASE_URL in Vercel

### Step 1: Create Vercel Postgres Database

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Choose a name (e.g., `gachi-rewards-db`)
6. Select a region
7. Click **"Create"**

### Step 2: Get Connection String

1. Click on your database
2. Go to **"Settings"** tab
3. Scroll to **"Connection String"** section
4. Find **`POSTGRES_PRISMA_URL`** (NOT `POSTGRES_URL`)
5. Click **"Copy"** to copy the connection string
   - Format: `postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15`

### Step 3: Add DATABASE_URL Environment Variable

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Fill in:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the `POSTGRES_PRISMA_URL` you copied
   - **Environments**: ✅ Check **Production**, **Preview**, and **Development**
4. Click **"Save"**

### Step 4: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**

Or push a new commit to trigger a new deployment.

## Verification

After redeploying, check the build logs. You should see:
- ✅ `prisma generate` completes successfully
- ✅ `prisma migrate deploy` runs
- ✅ Build completes without errors

## Important Notes

- **Must use `POSTGRES_PRISMA_URL`**, not `POSTGRES_URL`
  - `POSTGRES_PRISMA_URL` includes connection pooling (`pgbouncer=true`)
  - Required for Prisma in serverless environments
- **Connection string must start with `postgres://` or `postgresql://`**
- **Environment variable must be set for all environments** (Production, Preview, Development)
- **You must redeploy** after adding the environment variable for it to take effect

## Quick Checklist

- [ ] Vercel Postgres database created
- [ ] `POSTGRES_PRISMA_URL` copied from database settings
- [ ] `DATABASE_URL` environment variable added in Vercel
- [ ] Value starts with `postgres://` or `postgresql://`
- [ ] Environment variable enabled for Production, Preview, and Development
- [ ] Redeployed after adding the variable

## Still Having Issues?

If you've set `DATABASE_URL` but still get the error:

1. **Verify the connection string format:**
   - Must start with `postgres://` or `postgresql://`
   - Should include `?pgbouncer=true&connect_timeout=15`

2. **Check environment variable scope:**
   - Make sure it's enabled for the environment you're deploying to
   - Production deployments need Production environment variables
   - Preview deployments need Preview environment variables

3. **Check Vercel build logs:**
   - Look for the exact error message
   - Verify `DATABASE_URL` is being read (check if it shows in logs)

4. **Try redeploying:**
   - Sometimes Vercel needs a fresh deployment to pick up new environment variables

---

**Once `DATABASE_URL` is correctly set in Vercel, the build should succeed!** 🚀

