#!/bin/bash
# Script: fix-hamburger-menu-scripts.sh
# Purpose: Ensure all HTML files include the correct hamburger menu script

set -e

TARGET_SCRIPT='<script type="module" src="assets/js/main.min.js" defer></script>'

for file in *.html; do
  # Remove any existing main.js or main.min.js script includes
  sed -i.bak '/<script[^>]*src="assets\/js\/main\\(\\.min\\)\?\\.js"[^>]*><\/script>/d' "$file"
  # Remove any empty lines left behind
  sed -i.bak '/^[[:space:]]*$/d' "$file"
  # Add the correct script before </body> if not already present
  if ! grep -q "$TARGET_SCRIPT" "$file"; then
    awk -v script="$TARGET_SCRIPT" '/<\/body>/ {print script} 1' "$file" > tmpfile && mv tmpfile "$file"
  fi
  rm "$file.bak"
done

echo "All HTML files now include the correct hamburger menu script." 