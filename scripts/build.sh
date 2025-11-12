#!/bin/bash
set -e

# Configure Git for Vercel build environment
git config --global --add safe.directory '*'
git config --global user.name 'Vercel'
git config --global user.email 'vercel@vercel.com'
git config --global init.defaultBranch main

# Set Git environment variables
export GIT_AUTHOR_NAME='Vercel'
export GIT_AUTHOR_EMAIL='vercel@vercel.com'
export GIT_COMMITTER_NAME='Vercel'
export GIT_COMMITTER_EMAIL='vercel@vercel.com'

# Run build and setup
npm run build
npm run setup

