# Fix: Database Connection Error (P1001)

## Error Message

```
Error: P1001
Can't reach database server at `db.prisma.io:5432`
```

## Root Cause

The `DATABASE_URL` environment variable in Vercel is either:
- **Not set** (missing)
- **Empty** (set but blank)
- **Invalid format** (not a valid PostgreSQL connection string)
- **Not accessible** during build (wrong environment scope)

The hostname `db.prisma.io` suggests Prisma is using a default/placeholder value because `DATABASE_URL` is missing or invalid.

## Solution: Verify and Set DATABASE_URL in Vercel

### Step 1: Check if DATABASE_URL Exists

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Look for `DATABASE_URL` in the list

**If it doesn't exist**, proceed to Step 2.

**If it exists**, check:
- Is the value correct? (should start with `postgres://` or `postgresql://`)
- Is it enabled for the correct environments? (Production, Preview, Development)

### Step 2: Create Vercel Postgres Database (if not done)

1. In Vercel Dashboard → Your Project → **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a name (e.g., `gachi-rewards-db`)
5. Select a region
6. Click **"Create"**

### Step 3: Get the Connection String

1. Click on your database
2. Go to **"Settings"** tab
3. Scroll to **"Connection String"** section
4. Find **`POSTGRES_PRISMA_URL`** (NOT `POSTGRES_URL`)
5. Click **"Copy"** to copy the connection string

**Expected format:**
```
postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15
```

**Important:** 
- Must use `POSTGRES_PRISMA_URL` (includes connection pooling)
- Must start with `postgres://` or `postgresql://`
- Should include `?pgbouncer=true` for serverless environments

### Step 4: Add/Update DATABASE_URL Environment Variable

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. **If DATABASE_URL exists:**
   - Click on it
   - Click **"Edit"**
   - Update the value with `POSTGRES_PRISMA_URL`
   - Verify environments are checked (Production, Preview, Development)
   - Click **"Save"**

3. **If DATABASE_URL doesn't exist:**
   - Click **"Add New"**
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the `POSTGRES_PRISMA_URL` you copied
   - **Environments**: ✅ Check **Production**, **Preview**, and **Development**
   - Click **"Save"**

### Step 5: Verify the Value

After saving, verify:
- The value starts with `postgres://` or `postgresql://`
- The value is not empty
- All three environments are checked (Production, Preview, Development)

### Step 6: Redeploy

**Important:** Environment variables only take effect on new deployments.

1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**

Or push a new commit to trigger a new deployment.

## Common Issues

### Issue 1: DATABASE_URL is set but empty

**Symptom:** Variable exists but value is blank

**Fix:** Delete the variable and recreate it with the correct value

### Issue 2: Wrong environment scope

**Symptom:** Variable exists but only for Development, not Production

**Fix:** Edit the variable and check all three environments (Production, Preview, Development)

### Issue 3: Using POSTGRES_URL instead of POSTGRES_PRISMA_URL

**Symptom:** Connection works but migrations fail

**Fix:** Use `POSTGRES_PRISMA_URL` which includes connection pooling (`pgbouncer=true`)

### Issue 4: Connection string format is wrong

**Symptom:** Error about invalid protocol

**Fix:** Ensure it starts with `postgres://` or `postgresql://`, not `prisma://` or anything else

## Verification Checklist

After setting DATABASE_URL:

- [ ] DATABASE_URL exists in Vercel environment variables
- [ ] Value starts with `postgres://` or `postgresql://`
- [ ] Value is not empty
- [ ] Value uses `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- [ ] Enabled for Production, Preview, and Development
- [ ] Redeployed after adding/updating the variable

## Quick Test

After redeploying, check the build logs. You should see:
- ✅ `prisma generate` completes successfully
- ✅ `prisma migrate resolve` runs (if needed)
- ✅ `prisma migrate deploy` runs successfully
- ✅ Build completes without database connection errors

## Still Having Issues?

If you've verified DATABASE_URL is set correctly but still get the error:

1. **Check build logs** for the exact error message
2. **Verify** the connection string format matches the expected format
3. **Try deleting and recreating** the environment variable
4. **Check** if there are multiple DATABASE_URL variables (delete duplicates)
5. **Verify** the database is accessible (check Vercel Storage → Database → Status)

---

**Once DATABASE_URL is correctly set in Vercel, the `P1001` error should be resolved!** 🚀

