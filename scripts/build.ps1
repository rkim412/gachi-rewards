# PowerShell build script for Windows (local testing)
# Vercel uses bash, so build.sh is used in production

git config --global --add safe.directory '*'
git config --global user.name 'Vercel'
git config --global user.email 'vercel@vercel.com'
git config --global init.defaultBranch main

$env:GIT_AUTHOR_NAME = 'Vercel'
$env:GIT_AUTHOR_EMAIL = 'vercel@vercel.com'
$env:GIT_COMMITTER_NAME = 'Vercel'
$env:GIT_COMMITTER_EMAIL = 'vercel@vercel.com'

npm run build
npm run setup

