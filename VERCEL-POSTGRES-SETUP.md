# How to Set Up Vercel Postgres Database

## Method 1: Via Vercel Dashboard (Easiest)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub, GitLab, or email
3. Verify your email if needed

### Step 2: Create or Import Project
1. Click **"Add New"** → **"Project"**
2. Either:
   - **Import** your `gachi-rewards` repository from GitHub/GitLab
   - Or **Create** a new project (you can connect repo later)

### Step 3: Create Postgres Database
1. In your project dashboard, click the **"Storage"** tab (left sidebar)
2. Click **"Create Database"** button
3. Select **"Postgres"** from the options
4. Choose a plan:
   - **Hobby** (Free) - 256 MB storage, perfect for development
   - **Pro** - $20/month, 10 GB storage, for production
5. Select a **region** (choose closest to your users):
   - US East (Washington D.C.)
   - US West (San Francisco)
   - EU (Frankfurt)
   - Asia Pacific (Singapore)
6. Give it a name (optional): `gachi-rewards-db`
7. Click **"Create"**

### Step 4: Get Connection String
1. After creation, you'll see your database in the Storage tab
2. Click on your database name
3. Go to the **"Settings"** tab
4. Scroll to **"Connection String"** section
5. You'll see three connection strings:
   - `POSTGRES_URL` - Standard connection
   - `POSTGRES_PRISMA_URL` - **Use this one!** (Prisma-optimized with pooling)
   - `POSTGRES_URL_NON_POOLING` - Direct connection
6. **Copy the `POSTGRES_PRISMA_URL`** - it looks like:
   ```
   postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15
   ```

### Step 5: Add Environment Variable in Vercel
1. In your project, go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Fill in:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the `POSTGRES_PRISMA_URL` you copied
   - **Environment**: Select all three:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development
4. Click **"Save"**

### Step 6: Update Local .env File
1. Open your `.env` file in the project root
2. Update or add:
   ```env
   DATABASE_URL=postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15
   ```
   (Replace with your actual connection string)

### Step 7: Run Migrations
```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

### Step 8: Verify It Works
```bash
# Test connection
npx prisma db pull

# Open Prisma Studio to see your database
npm run db:studio
```

---

## Method 2: Via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 3: Link Your Project
```bash
# Navigate to your project
cd gachi-rewards

# Link to Vercel project
vercel link
```
Follow the prompts to select/create a project.

### Step 4: Create Postgres Database
```bash
vercel postgres create gachi-rewards-db
```

This will:
- Create the database
- Ask you to select a region
- Ask you to select a plan (choose Hobby for free)

### Step 5: Get Connection String
```bash
# Pull environment variables (includes database URLs)
vercel postgres env pull .env.local
```

This creates `.env.local` with:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### Step 6: Update .env File
```bash
# Copy POSTGRES_PRISMA_URL to DATABASE_URL in .env
# Or manually copy from .env.local
```

### Step 7: Run Migrations
```bash
npm run db:generate
npm run db:migrate
```

---

## Visual Guide: Dashboard Method

```
Vercel Dashboard
    ↓
Your Project
    ↓
Storage Tab (left sidebar)
    ↓
"Create Database" button
    ↓
Select "Postgres"
    ↓
Choose Plan: Hobby (Free)
    ↓
Select Region
    ↓
Click "Create"
    ↓
Database Created!
    ↓
Click Database → Settings
    ↓
Copy POSTGRES_PRISMA_URL
    ↓
Settings → Environment Variables
    ↓
Add: DATABASE_URL = (paste connection string)
    ↓
Save
```

---

## Troubleshooting

### Database Not Showing Up?
- Refresh the page
- Check you're in the correct project
- Look in the "Storage" tab, not "Deployments"

### Connection String Not Working?
- Make sure you're using `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- Check the connection string includes `?pgbouncer=true`
- Verify the database is not paused (Hobby plan pauses after inactivity)

### Migration Errors?
- Run `npm run db:generate` first
- Check `DATABASE_URL` is set correctly
- Verify database is active (not paused)

### Database Paused?
- Hobby plan pauses after 7 days of inactivity
- Click "Resume" in the database settings
- Wait a few seconds for it to wake up

---

## Quick Checklist

- [ ] Created Vercel account
- [ ] Created/imported project
- [ ] Created Postgres database (Storage tab)
- [ ] Copied `POSTGRES_PRISMA_URL` connection string
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Updated local `.env` file
- [ ] Ran `npm run db:generate`
- [ ] Ran `npm run db:migrate`
- [ ] Verified with `npm run db:studio`

---

## Next Steps After Setup

1. **Deploy your app:**
   ```bash
   vercel deploy
   ```

2. **Migrations run automatically** via the `setup` script in `package.json`

3. **Monitor your database:**
   - Go to Storage tab → Your database
   - View usage, connections, and logs

4. **Scale when needed:**
   - Hobby: 256 MB (free)
   - Pro: 10 GB ($20/month)
   - Enterprise: Custom

---

## Cost Information

- **Hobby (Free)**: 
  - 256 MB storage
  - 60 hours compute/month
  - Perfect for development and small apps
  
- **Pro ($20/month)**:
  - 10 GB storage
  - Unlimited compute
  - Better for production

For Gachi Rewards starting out, **Hobby tier is perfect**!

