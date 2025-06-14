const fs = require('fs');
const path = require('path');

// Read the template file
const template = fs.readFileSync('template.html', 'utf8');

// Extract header and footer from template
const headerMatch = template.match(/<header class="main-header">[\s\S]*?<\/header>/);
const footerMatch = template.match(/<footer class="footer">[\s\S]*?<\/footer>/);

if (!headerMatch || !footerMatch) {
    console.error('Could not find header or footer in template');
    process.exit(1);
}

const header = headerMatch[0];
const footer = footerMatch[0];

// Get all HTML files
const htmlFiles = fs.readdirSync('.')
    .filter(file => file.endsWith('.html') && file !== 'template.html');

// Update each file
htmlFiles.forEach(file => {
    console.log(`Updating ${file}...`);
    let content = fs.readFileSync(file, 'utf8');

    // Replace header
    const oldHeaderMatch = content.match(/<header[\s\S]*?<\/header>/);
    if (oldHeaderMatch) {
        content = content.replace(oldHeaderMatch[0], header);
    }

    // Replace footer
    const oldFooterMatch = content.match(/<footer[\s\S]*?<\/footer>/);
    if (oldFooterMatch) {
        content = content.replace(oldFooterMatch[0], footer);
    }

    // Write back to file
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});

console.log('All files updated successfully!'); 