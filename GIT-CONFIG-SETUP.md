# Git Configuration for Vercel

Vercel requires git commit author information to be properly configured. This ensures all commits have the correct author when deploying.

## Quick Setup

### Windows (PowerShell)
```powershell
.\scripts\setup-git-config.ps1
```

### Mac/Linux
```bash
chmod +x scripts/setup-git-config.sh
./scripts/setup-git-config.sh
```

### Manual Setup
```bash
git config --global user.name "rkim412"
git config --global user.email "rkim412@gmail.com"
```

## Verify Configuration

Check your git config:
```bash
git config --global user.name
git config --global user.email
```

Should output:
```
rkim412
rkim412@gmail.com
```

## Why This Matters

- **Vercel** reads commit author information from git commits
- All commits need proper author attribution
- This ensures Vercel can track deployments correctly

## Note

The `.gitconfig` file in the repository root is a reference. Git config is typically stored in:
- **Windows**: `C:\Users\YourUsername\.gitconfig`
- **Mac/Linux**: `~/.gitconfig`

Vercel doesn't read `.gitconfig` files from the repository - it uses the author information from the git commits themselves. So make sure to configure git **before** making commits.

