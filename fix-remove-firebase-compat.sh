#!/bin/bash
# Script: fix-remove-firebase-compat.sh
# Purpose: Remove all Firebase compat scripts from all HTML files

set -e

# Remove all compat script includes from HTML files
for file in *.html; do
  sed -i.bak '/firebase-auth-compat.js/d' "$file"
  sed -i.bak '/firebase-firestore-compat.js/d' "$file"
  sed -i.bak '/firebase-compat.js/d' "$file"
  sed -i.bak '/firebase-app-compat.js/d' "$file"
  sed -i.bak '/firebase-analytics-compat.js/d' "$file"
  sed -i.bak '/firebase-storage-compat.js/d' "$file"
  sed -i.bak '/firebase-messaging-compat.js/d' "$file"
  sed -i.bak '/firebase-functions-compat.js/d' "$file"
  sed -i.bak '/firebase-database-compat.js/d' "$file"
  sed -i.bak '/firebase-remote-config-compat.js/d' "$file"
  rm "$file.bak"
done

echo "All compat scripts removed from HTML files." 