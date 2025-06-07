const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy all files except node_modules and dist
function copyFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (src.includes('node_modules') || src.includes('dist') || src.includes('.git')) {
      return;
    }
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyFiles(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('📂 Copying files...');
copyFiles('.', 'dist');

console.log('✅ Build complete!'); 