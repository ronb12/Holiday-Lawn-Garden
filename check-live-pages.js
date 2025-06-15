const fs = require('fs');
const https = require('https');

const LIVE_BASE = 'https://ronb12.github.io/Holliday-Lawn-Garden/';

// Get all .html files in the project root
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

function checkUrl(url) {
  return new Promise(resolve => {
    https
      .get(url, res => {
        resolve({ url, status: res.statusCode });
      })
      .on('error', () => {
        resolve({ url, status: 'ERROR' });
      });
  });
}

(async () => {
  console.log('Checking live site for all HTML pages...\n');
  for (const file of htmlFiles) {
    const url = LIVE_BASE + file;
    const result = await checkUrl(url);
    if (result.status === 200) {
      console.log(`✅ ${file} is LIVE (${url})`);
    } else {
      console.log(`❌ ${file} is MISSING or ERROR (Status: ${result.status}) (${url})`);
    }
  }
})();
