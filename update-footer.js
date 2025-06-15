const fs = require('fs');
const path = require('path');

// Read the template footer
const templateFooter = fs
  .readFileSync('template.html', 'utf8')
  .match(/<footer class="footer"[\s\S]*?<\/footer>/)[0];

// Get all HTML files
const htmlFiles = fs
  .readdirSync('.')
  .filter(file => file.endsWith('.html') && file !== 'template.html');

// Update each file
htmlFiles.forEach(file => {
  console.log(`Updating footer in ${file}...`);

  // Read the file
  let content = fs.readFileSync(file, 'utf8');

  // Replace the old footer with the new one
  const oldFooterMatch = content.match(/<footer class="footer"[\s\S]*?<\/footer>/);
  if (oldFooterMatch) {
    content = content.replace(oldFooterMatch[0], templateFooter);

    // Add the copyright year script if it doesn't exist
    if (!content.includes('current-year')) {
      content = content.replace(
        '</body>',
        `
  <script>
    // Update copyright year
    document.getElementById('current-year').textContent = new Date().getFullYear();
  </script>
</body>`
      );
    }

    // Write the updated content back to the file
    fs.writeFileSync(file, content);
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`⚠ No footer found in ${file}`);
  }
});

console.log('\nFooter update complete!');
