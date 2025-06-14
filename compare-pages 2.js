const fs = require('fs');
const https = require('https');

const LIVE_BASE = 'https://ronb12.github.io/Holliday-Lawn-Garden/';
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

function fetchLivePage(url) {
  return new Promise((resolve) => {
    let data = '';
    https.get(url, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });
}

(async () => {
  let allMatch = true;
  for (const file of htmlFiles) {
    const localContent = fs.readFileSync(file, 'utf8').replace(/\s+/g, '');
    const liveContent = await fetchLivePage(LIVE_BASE + file);
    if (!liveContent) {
      console.log(`❌ ${file}: Could not fetch live page.`);
      allMatch = false;
      continue;
    }
    const liveContentStripped = liveContent.replace(/\s+/g, '');
    if (localContent === liveContentStripped) {
      console.log(`✅ ${file}: Live page matches local file.`);
    } else {
      console.log(`❌ ${file}: Live page does NOT match local file.`);
      allMatch = false;
    }
  }
  if (allMatch) {
    console.log('\nAll live pages match your local project folder!');
  } else {
    console.log('\nSome pages do not match. Please review the above results.');
  }
})(); 