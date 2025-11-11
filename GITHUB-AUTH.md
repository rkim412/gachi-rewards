# GitHub Authentication & Push Instructions

## ✅ Repository Connected

Your local repository is connected to:
**https://github.com/rkim412/gachi-rewards**

## 🔐 Authentication Required

To push your code, you need to authenticate with GitHub.

### Option 1: Personal Access Token (Recommended)

1. **Create Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Name: "Gachi Rewards"
   - Select scope: **`repo`** (full control)
   - Click **"Generate token"**
   - **Copy the token** (you won't see it again!)

2. **Push using token:**
   ```bash
   git push -u origin main
   ```
   - When prompted for **Username**: Enter your GitHub username (`rkim412`)
   - When prompted for **Password**: Paste the token (not your GitHub password!)

### Option 2: GitHub CLI

```bash
# Install GitHub CLI
winget install GitHub.cli

# Login
gh auth login

# Push
git push -u origin main
```

### Option 3: SSH Key (Advanced)

1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to: https://github.com/settings/keys
   - Add new SSH key

3. Change remote to SSH:
   ```bash
   git remote set-url origin git@github.com:rkim412/gachi-rewards.git
   git push -u origin main
   ```

---

## 🚀 Quick Push Commands

After authenticating:

```bash
# Check status
git status

# Push to GitHub
git push -u origin main
```

---

## ✅ Verify Push

After pushing, check:
- https://github.com/rkim412/gachi-rewards
- You should see all your files!

---

## 📋 What Will Be Pushed

✅ All source code (`app/`, `extensions/`)  
✅ Database schema (`prisma/schema.prisma`)  
✅ Configuration files (`shopify.app.toml`, `package.json`)  
✅ Documentation (`.md` files)  
✅ `.env.example` template  

❌ **NOT pushed** (protected by `.gitignore`):
- `.env` - Your secrets
- `node_modules/` - Dependencies
- `prisma/dev.sqlite` - Local database

---

## 🎯 After Pushing

1. **Deploy to Vercel:**
   - Import from GitHub
   - Add environment variables
   - Deploy!

2. **Set up Vercel Postgres:**
   - Create database in Vercel
   - Copy connection string
   - Add to environment variables

3. **Deploy Shopify Extensions:**
   - Run `shopify app deploy`
   - Configure App Proxy

---

## Need Help?

If push fails:
- Check you're authenticated
- Verify repository exists: https://github.com/rkim412/gachi-rewards
- Try using Personal Access Token
- Check network connection

