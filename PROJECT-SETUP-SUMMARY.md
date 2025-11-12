# Gachi Rewards - Project Setup Summary

This document explains the two project setups: **Local Development** and **Production (Vercel)**.

---

## 🏗️ Two Project Environments

### 1. Local Development Project
**Purpose**: Test and develop the app locally with Shopify integration

**Database**: SQLite (easiest) or Local PostgreSQL  
**Hosting**: Local machine via Shopify CLI tunnel  
**Use Case**: Development, testing, debugging

**Setup Guide**: [SETUP-LOCAL.md](./SETUP-LOCAL.md)

**Key Features**:
- ✅ Full Shopify integration via CLI tunnel
- ✅ Hot-reload development
- ✅ Easy database setup (SQLite)
- ✅ Test in development store
- ✅ Debug locally

---

### 2. Production Project (Vercel)
**Purpose**: Deploy to production for real Shopify stores

**Database**: Vercel Postgres (PostgreSQL)  
**Hosting**: Vercel (serverless)  
**Use Case**: Production deployment, real customers

**Setup Guide**: [SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md)

**Key Features**:
- ✅ Production-ready PostgreSQL database
- ✅ Automatic scaling
- ✅ SSL/HTTPS included
- ✅ Environment variable management
- ✅ Automatic deployments from GitHub

---

## 📊 Comparison

| Feature | Local Development | Production (Vercel) |
|---------|------------------|---------------------|
| **Database** | SQLite or Local PostgreSQL | Vercel Postgres (PostgreSQL) |
| **Hosting** | Local machine + Shopify CLI tunnel | Vercel (serverless) |
| **URL** | `https://abc123.ngrok.io` (temporary) | `https://your-app.vercel.app` (permanent) |
| **Setup Time** | ~10 minutes | ~15 minutes |
| **Cost** | Free | Free tier available |
| **Best For** | Development & testing | Production use |
| **Database Migrations** | Manual: `npm run db:migrate` | Automatic during build |
| **Environment Variables** | `.env` file | Vercel Dashboard |

---

## 🚀 Quick Start

### Local Development
```bash
# 1. Follow SETUP-LOCAL.md
# 2. Or use quick setup script:
bash scripts/setup-local.sh        # Linux/Mac
.\scripts\setup-local.ps1          # Windows PowerShell

# 3. Start development
npm run dev
```

### Production
```bash
# 1. Follow SETUP-PRODUCTION.md
# 2. Push to GitHub
git push origin main

# 3. Import to Vercel (via dashboard)
# 4. Configure environment variables
# 5. Deploy!
```

---

## 📁 Project Structure

Both environments use the **same codebase** - only configuration differs:

```
gachi-rewards/
├── app/                    # Application code (same for both)
├── extensions/            # Shopify extensions (same for both)
├── prisma/
│   ├── schema.prisma      # Production schema (PostgreSQL)
│   └── schema.local.sqlite.prisma  # Local dev schema (SQLite reference)
├── scripts/
│   ├── setup-local.sh     # Quick local setup
│   └── setup-local.ps1   # Quick local setup (Windows)
├── SETUP-LOCAL.md         # Local development guide
├── SETUP-PRODUCTION.md    # Production deployment guide
└── README.md              # Main documentation
```

---

## 🔧 Environment Variables

### Local Development (`.env` file)
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL="file:./prisma/dev.sqlite"  # or PostgreSQL URL
NODE_ENV=development
```

### Production (Vercel Dashboard)
```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SCOPES=write_products,read_customers,write_customers,read_orders,write_discounts,read_discounts,write_app_proxy
DATABASE_URL=postgres://... (from POSTGRES_PRISMA_URL)
NODE_ENV=production
```

---

## 🗄️ Database Setup

### Local Development

**Option 1: SQLite (Recommended for Quick Testing)**
- No database server needed
- File-based: `prisma/dev.sqlite`
- Perfect for local development
- See `prisma/schema.local.sqlite.prisma` for reference

**Option 2: Local PostgreSQL**
- More production-like
- Requires PostgreSQL installation
- Better for testing production scenarios

### Production

**Vercel Postgres (PostgreSQL)**
- Managed PostgreSQL database
- Connection pooling included
- Automatic backups
- Scales automatically

---

## 🔄 Workflow

### Typical Development Workflow

1. **Develop Locally**
   - Use local development setup
   - Test with development store
   - Debug and iterate

2. **Deploy to Production**
   - Push code to GitHub
   - Vercel auto-deploys
   - Test in production store

3. **Monitor**
   - Check Vercel logs
   - Monitor database
   - Track errors

---

## 📝 Next Steps

1. **For Local Development**: Read [SETUP-LOCAL.md](./SETUP-LOCAL.md)
2. **For Production**: Read [SETUP-PRODUCTION.md](./SETUP-PRODUCTION.md)
3. **For Overview**: Read [README.md](./README.md)

---

## ❓ Common Questions

**Q: Can I use the same Shopify app for both?**  
A: Yes! Use the same `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` in both environments.

**Q: Do I need separate databases?**  
A: Yes - local dev uses SQLite/local PostgreSQL, production uses Vercel Postgres.

**Q: Can I test production locally?**  
A: Yes - use local PostgreSQL to match production database setup.

**Q: How do I switch between environments?**  
A: Just change the `DATABASE_URL` in `.env` and run migrations.

---

**Both environments are ready to use! Choose the one that fits your needs.** 🚀

