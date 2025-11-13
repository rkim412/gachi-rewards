# Fix Database and Import Errors

## Issues Fixed

1. ✅ **`json` import error** - Changed from `react-router` to `@react-router/node`
2. ✅ **Prisma client error** - Changed from `@prisma/client/edge` to `@prisma/client` for local SQLite

## Remaining Issue: Database Migration

The `session` table doesn't exist yet. You need to run migrations, but the database is locked.

## Step-by-Step Fix

### 1. Stop All Running Processes

**Stop these if running:**
- Dev server (`npm run dev` or `shopify app dev`) - Press `Ctrl+C`
- Prisma Studio (`npm run db:studio`) - Press `Ctrl+C`
- Any other Node.js processes using the database

### 2. Remove Database Lock Files

Run this command:
```powershell
Remove-Item "prisma\dev.sqlite-journal" -ErrorAction SilentlyContinue
Remove-Item "prisma\dev.sqlite-wal" -ErrorAction SilentlyContinue
Remove-Item "prisma\dev.sqlite-shm" -ErrorAction SilentlyContinue
```

Or use the script:
```powershell
.\scripts\fix-database-locked.ps1
```

### 3. Run Database Migration

Once all processes are stopped and lock files removed:

```powershell
npx prisma migrate dev --name init
```

This will:
- Create the `Session` table
- Create all other tables (StorefrontUser, ReferralDiscountCode, etc.)
- Generate the Prisma Client

### 4. Verify Database is Created

Check that `prisma/dev.sqlite` exists and has tables:
```powershell
npx prisma studio
```

You should see all tables including `Session`.

### 5. Start Dev Server

Now you can start the dev server:
```powershell
npm run dev
```

## If Database is Still Locked

If you still get "database is locked" errors:

1. **Check for running Node processes:**
   ```powershell
   Get-Process -Name "node" -ErrorAction SilentlyContinue
   ```

2. **Kill specific processes if needed:**
   ```powershell
   Stop-Process -Id <PROCESS_ID> -Force
   ```

3. **Alternative: Delete and recreate database** (⚠️ This deletes all data):
   ```powershell
   Remove-Item "prisma\dev.sqlite*" -Force
   npx prisma migrate dev --name init
   ```

## Summary of Code Changes Made

### Files Updated:

1. **`app/db.server.js`**
   - Changed from `@prisma/client/edge` to `@prisma/client`
   - Only uses Accelerate extension when `DATABASE_URL` starts with `prisma://` (production)

2. **`app/routes/apps.gachi-rewards.api.generate.jsx`**
   - Changed `import { json } from "react-router"` to `import { json } from "@react-router/node"`

3. **`app/routes/apps.gachi-rewards.api.safe-link.jsx`**
   - Changed `import { json } from "react-router"` to `import { json } from "@react-router/node"`

## After Migration Succeeds

Once migrations run successfully, your app should start without errors. The session table will exist, and the Prisma client will work correctly with SQLite.

