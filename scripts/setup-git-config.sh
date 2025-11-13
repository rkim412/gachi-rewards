#!/bin/bash
# Git Configuration Setup Script
# Run this script to configure git with the correct user name and email for Vercel deployments

echo "Setting up git configuration..."

# Set global git user name
git config --global user.name "rkim412"
if [ $? -eq 0 ]; then
    echo "✓ Git user name set to: rkim412"
else
    echo "✗ Failed to set git user name"
    exit 1
fi

# Set global git user email
git config --global user.email "rkim412@gmail.com"
if [ $? -eq 0 ]; then
    echo "✓ Git user email set to: rkim412@gmail.com"
else
    echo "✗ Failed to set git user email"
    exit 1
fi

# Verify configuration
echo ""
echo "Verifying configuration..."
NAME=$(git config --global user.name)
EMAIL=$(git config --global user.email)

echo "Current git config:"
echo "  User name: $NAME"
echo "  User email: $EMAIL"

if [ "$NAME" = "rkim412" ] && [ "$EMAIL" = "rkim412@gmail.com" ]; then
    echo ""
    echo "✓ Git configuration is correct!"
    echo "All future commits will use this author information."
else
    echo ""
    echo "✗ Git configuration verification failed"
    exit 1
fi

