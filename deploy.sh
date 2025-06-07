#!/bin/bash

# Create necessary directories if they don't exist
mkdir -p public/js public/css public/assets/images public/icons

# Move HTML files
cp *.html public/

# Move JavaScript files
cp js/*.js public/js/

# Move CSS files
cp *.css public/css/

# Move assets
cp -r assets/* public/assets/

# Move icons
cp icons/* public/icons/

# Move manifest
cp manifest.json public/

echo "Files have been organized for Firebase hosting deployment" 