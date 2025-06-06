const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  srcDir: 'src',
  publicDir: 'public',
  distDir: 'dist',
  copy: ['assets', 'styles', 'js'],
  processHtml: true
};

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy directory recursively
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Process HTML files
function processHtml(content) {
  // Update paths to match new structure
  content = content.replace(/href="\.\/styles\//g, 'href="./');
  content = content.replace(/src="\.\/js\//g, 'src="./');
  content = content.replace(/src="\.\/assets\//g, 'src="./');
  return content;
}

// Main build process
function build() {
  console.log('🚀 Starting build process...');

  // Clean dist directory
  if (fs.existsSync(config.distDir)) {
    fs.rmSync(config.distDir, { recursive: true });
  }
  ensureDir(config.distDir);

  // Copy public files
  console.log('📂 Copying public files...');
  copyDir(config.publicDir, config.distDir);

  // Copy and process source files
  console.log('🔨 Processing source files...');
  for (const dir of config.copy) {
    const srcPath = path.join(config.srcDir, dir);
    const destPath = path.join(config.distDir, dir);
    if (fs.existsSync(srcPath)) {
      copyDir(srcPath, destPath);
    }
  }

  // Process HTML files
  if (config.processHtml) {
    console.log('📄 Processing HTML files...');
    const pagesDir = path.join(config.srcDir, 'pages');
    const htmlFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
      const processed = processHtml(content);
      fs.writeFileSync(path.join(config.distDir, file), processed);
    }
  }

  console.log('✅ Build complete!');
}

// Run build
build(); 