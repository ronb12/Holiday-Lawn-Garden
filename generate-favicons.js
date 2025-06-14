const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512
};

const sourceLogo = 'assets/images/hollidays-logo.optimized-1280.png';
const outputDir = 'assets/images/favicon';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate each favicon size
Object.entries(sizes).forEach(([filename, size]) => {
  sharp(sourceLogo)
    .resize(size, size)
    .toFile(path.join(outputDir, filename))
    .then(() => console.log(`Generated ${filename}`))
    .catch(err => console.error(`Error generating ${filename}:`, err));
}); 