const fs = require('fs');
const path = require('path');

const correctContactInfo = {
  owner: 'Karl Holliday',
  phone: '(504) 717-1887',
  email: '7holliday@gmail.com',
};

function updateContactInfo(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace any phone number in the footer contact section
    content = content.replace(
      /<a[^>]*href="tel:[^"]*"[^>]*>\s*<i[^>]*fa-phone[^>]*><\/i>\s*<span>[^<]*<\/span>\s*<\/a>/g,
      `<a href="tel:+15047171887" aria-label="Link" class="link-with-loading link-with-loading">
        <i class="fas fa-phone" aria-hidden="true"></i>
        <span>${correctContactInfo.phone}</span>
      </a>`
    );

    // Replace any email in the footer contact section
    content = content.replace(
      /<a[^>]*href="mailto:[^"]*"[^>]*>\s*<i[^>]*fa-envelope[^>]*><\/i>\s*<span>[^<]*<\/span>\s*<\/a>/g,
      `<a href="mailto:${correctContactInfo.email}" aria-label="Link" class="link-with-loading link-with-loading">
        <i class="fas fa-envelope" aria-hidden="true"></i>
        <span>${correctContactInfo.email}</span>
      </a>`
    );

    // Ensure owner name is present in the contact section (add above phone if not present)
    content = content.replace(
      /(<div class="footer-contact">)(\s*)/,
      `$1$2<span class="footer-owner">${correctContactInfo.owner}</span>$2`
    );

    fs.writeFileSync(filePath, content);
    console.log(`Updated contact info in ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Get all HTML files in the root directory
const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));

// Update contact info in each HTML file
htmlFiles.forEach(file => {
  updateContactInfo(file);
});

console.log('Contact information update complete!');
