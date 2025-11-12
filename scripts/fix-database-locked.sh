#!/bin/bash
# Fix SQLite "database is locked" error
# Usage: ./scripts/fix-database-locked.sh

echo "🔧 Fixing SQLite database locked error..."
echo ""

# Check if Prisma Studio is running
echo "Checking for running processes..."
if pgrep -f "prisma.*studio" > /dev/null; then
    echo "⚠️  Prisma Studio is running. Please close it first (Ctrl+C in the terminal running it)."
    echo ""
fi

# Delete lock files
echo "Removing SQLite lock files..."

LOCK_FILES=(
    "prisma/dev.sqlite-wal"
    "prisma/dev.sqlite-shm"
)

REMOVED=false
for file in "${LOCK_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "✅ Removed: $file"
        REMOVED=true
    fi
done

if [ "$REMOVED" = false ]; then
    echo "ℹ️  No lock files found."
fi

echo ""
echo "✅ Database lock files cleaned up!"
echo ""
echo "Next steps:"
echo "1. Make sure Prisma Studio is closed (if it was running)"
echo "2. Make sure dev server is stopped (if it was running)"
echo "3. Run: npm run db:migrate"
echo ""

