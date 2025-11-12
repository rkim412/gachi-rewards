# 🔗 Localhost URL Setup Guide

Complete guide to setting up URLs for local development.

---

## Understanding the URLs

When developing locally, you'll work with **two different URLs**:

1. **Localhost URL** (`http://localhost:3000`) - Used in `.env` file
2. **Tunnel URL** (`https://abc123.ngrok.io`) - Created automatically by Shopify CLI, used in Shopify Partners dashboard

---

## Step 1: Set Localhost URL in .env File

In your `.env` file, set the localhost URL:

```env
SHOPIFY_APP_URL=http://localhost:3000
```

**Why `localhost:3000`?**
- Your app runs on port `3000` by default (see `vite.config.js`)
- This is the URL your app uses internally
- Shopify CLI will automatically create a tunnel from this

**Important:** Keep this as `http://localhost:3000` - don't change it!

---

## Step 2: Start Development Server

Run:

```bash
npm run dev
```

**What happens:**
1. Shopify CLI starts your app on `http://localhost:3000`
2. CLI automatically creates a **secure tunnel** (using ngrok)
3. You'll see output like:
   ```
   ✓ Tunnel created: https://abc123-def456.ngrok-free.app
   ```
4. **Copy this tunnel URL** - you'll need it next!

---

## Step 3: Configure URLs in Shopify Partners Dashboard

Go to https://partners.shopify.com → Your app → **App setup** tab

### A. App URL

1. Scroll to **"App URL"** section
2. Set it to your **tunnel URL** (from Step 2):
   ```
   https://abc123-def456.ngrok-free.app
   ```
3. **Not** `http://localhost:3000` - use the tunnel URL!

### B. Allowed Redirection URL(s)

1. Scroll to **"Allowed redirection URL(s)"**
2. Add:
   ```
   https://abc123-def456.ngrok-free.app/auth
   ```
   (Use your tunnel URL + `/auth`)

### C. App Proxy URL

1. Scroll to **"App Proxy"** section
2. Configure:
   - **Subpath prefix**: `apps`
   - **Subpath**: `gachi-rewards`
   - **Proxy URL**: `https://abc123-def456.ngrok-free.app/apps/gachi-rewards`
     - Use your tunnel URL + `/apps/gachi-rewards`
3. Click **"Save"**

---

## Step 4: Understanding the Flow

```
┌─────────────────────────────────────────────────────────┐
│ Your Computer                                           │
│                                                         │
│  .env file:                                             │
│  SHOPIFY_APP_URL=http://localhost:3000                 │
│                                                         │
│  App running on:                                        │
│  http://localhost:3000                                  │
│         │                                               │
│         │ (Shopify CLI creates tunnel)                  │
│         ▼                                               │
│  Tunnel URL:                                            │
│  https://abc123.ngrok.io                                │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
          │ (Public internet)
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ Shopify Partners Dashboard                              │
│                                                         │
│  App URL: https://abc123.ngrok.io                       │
│  App Proxy: https://abc123.ngrok.io/apps/gachi-rewards │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Important Notes

### ⚠️ Tunnel URL Changes

**The tunnel URL changes every time you restart `npm run dev`!**

If you restart the dev server:
1. **New tunnel URL** will be generated
2. **Update Shopify Partners dashboard** with the new URL:
   - App URL
   - Allowed redirection URL(s)
   - App Proxy URL

### ✅ Automatic URL Updates

The `shopify.app.toml` has:
```toml
[build]
automatically_update_urls_on_dev = true
```

This means Shopify CLI **automatically updates** some URLs, but you still need to manually update:
- App Proxy URL in Partners Dashboard
- Allowed redirection URL(s)

### 🔒 Why Use a Tunnel?

- Shopify needs to reach your local app from the internet
- `localhost` is only accessible on your computer
- Tunnel (ngrok) creates a public URL that forwards to localhost
- This allows Shopify to send webhooks and proxy requests

---

## Quick Reference

### In `.env` file:
```env
SHOPIFY_APP_URL=http://localhost:3000
```

### In Shopify Partners Dashboard:
- **App URL**: `https://your-tunnel-url.ngrok.io`
- **Allowed redirection URL(s)**: `https://your-tunnel-url.ngrok.io/auth`
- **App Proxy URL**: `https://your-tunnel-url.ngrok.io/apps/gachi-rewards`

---

## Troubleshooting

### "App not loading in Shopify admin"

**Check:**
1. Is dev server running? (`npm run dev`)
2. Is App URL in Partners Dashboard set to tunnel URL (not localhost)?
3. Did tunnel URL change? Update Partners Dashboard

### "App Proxy returns 401"

**Check:**
1. App Proxy URL in Partners Dashboard matches your tunnel URL
2. URL includes `/apps/gachi-rewards` at the end
3. Tunnel is still active (dev server running)

### "Tunnel URL not working"

**Try:**
1. Restart dev server: Stop (`Ctrl+C`) and run `npm run dev` again
2. Copy the new tunnel URL
3. Update all URLs in Partners Dashboard

---

## Summary

1. **`.env`**: Always use `http://localhost:3000`
2. **Shopify Partners**: Always use the tunnel URL (from `npm run dev` output)
3. **Update URLs**: Every time you restart `npm run dev`, update Partners Dashboard
4. **Keep dev server running**: Tunnel only works while `npm run dev` is active

---

## Example Workflow

```bash
# 1. Start dev server
npm run dev

# Output shows:
# ✓ Tunnel created: https://abc123.ngrok.io

# 2. Copy tunnel URL: https://abc123.ngrok.io

# 3. Go to Shopify Partners Dashboard
# 4. Update:
#    - App URL: https://abc123.ngrok.io
#    - Allowed redirection URL(s): https://abc123.ngrok.io/auth
#    - App Proxy URL: https://abc123.ngrok.io/apps/gachi-rewards

# 5. Test your app!
```

---

**Need more help?** See [QUICK-START.md](./QUICK-START.md) for full setup guide.

