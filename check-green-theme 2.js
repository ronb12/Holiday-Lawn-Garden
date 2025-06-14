const fs = require('fs');
const path = require('path');

const GREEN_COLORS = [
  '#388e3c', '#4caf50', '#256029', '#81c784',
  'var(--color-primary)', 'var(--color-primary-dark)', 'var(--color-primary-light)', 'var(--color-accent)'
];

function scanFileForGreenTheme(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
  return GREEN_COLORS.some(color => content.includes(color));
}

function scanCssFiles(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
  let allGreen = true;
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (!scanFileForGreenTheme(filePath)) {
      console.log(`❌ ${filePath} does NOT use the green theme.`);
      allGreen = false;
    } else {
      console.log(`✅ ${filePath} uses the green theme.`);
    }
  }
  return allGreen;
}

function scanHtmlFiles() {
  const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
  let allGreen = true;
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    if (!GREEN_COLORS.some(color => content.includes(color))) {
      console.log(`❌ ${file} does NOT reference the green theme.`);
      allGreen = false;
    } else {
      console.log(`✅ ${file} references the green theme.`);
    }
  }
  return allGreen;
}

console.log('--- Checking CSS files for green theme ---');
let cssAllGreen = scanCssFiles('./assets/styles');
if (fs.existsSync('./assets/styles/components')) {
  cssAllGreen = scanCssFiles('./assets/styles/components') && cssAllGreen;
}

console.log('\n--- Checking HTML files for green theme references ---');
const htmlAllGreen = scanHtmlFiles();

if (cssAllGreen && htmlAllGreen) {
  console.log('\n✅ All files use the professional green theme!');
} else {
  console.log('\n❌ Some files do not use the green theme. Please review the above results.');
} 