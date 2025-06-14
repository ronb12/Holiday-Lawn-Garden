#!/bin/bash
# Script: fix-firebase-config-includes.sh
# Purpose: Ensure all HTML files include the correct Firebase config script include

set -e

FIREBASE_SCRIPT='<script type="module" src="assets/js/firebase-config.js"></script>'

for file in *.html; do
  # Remove any existing firebase-config script includes
  sed -i.bak '/<script[^>]*src="[^"]*firebase-config[^"]*\.js"[^>]*><\/script>/d' "$file"
  # Add the correct script before the main app script if not already present
  if ! grep -q "$FIREBASE_SCRIPT" "$file"; then
    awk -v script="$FIREBASE_SCRIPT" '
      /<script type="module" src="assets\/js\/main(\.min)?\.js"/ && !added {print script; added=1}
      {print}
    ' "$file" > tmpfile && mv tmpfile "$file"
  fi
  rm "$file.bak"
done

echo "All HTML files now include the correct Firebase config script include." 