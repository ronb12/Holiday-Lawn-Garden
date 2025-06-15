const fs = require('fs');
const path = require('path');

class FinalAudit {
  constructor() {
    this.htmlDir = '.';
  }

  async audit() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to audit`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Fix images
        content = this.fixImages(content);

        // Fix meta tags
        content = this.fixMetaTags(content, file);

        // Fix headings
        content = this.fixHeadings(content);

        // Fix floating buttons
        content = this.fixFloatingButtons(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Audited ${file}`);
      } catch (error) {
        console.error(`Error auditing ${file}:`, error);
      }
    }
  }

  fixImages(content) {
    // Add picture element for images
    return content.replace(
      /<img([^>]*)src="([^"]*\.(jpg|jpeg|png))"([^>]*)>/g,
      (match, before, src, ext, after) => {
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
        return `
        <picture>
          <source srcset="${webpSrc}" type="image/webp">
          <img${before}src="${src}"${after} loading="lazy">
        </picture>`;
      }
    );
  }

  fixMetaTags(content, file) {
    const fileName = path.basename(file, '.html');
    const title = this.getPageTitle(fileName);
    const description = this.getPageDescription(fileName);

    // Add or update title
    if (!content.includes('<title>')) {
      content = content.replace(/<head>/, `<head>\n    <title>${title}</title>`);
    } else {
      content = content.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    }

    // Add or update meta description
    if (!content.includes('meta name="description"')) {
      content = content.replace(
        /<head>/,
        `<head>\n    <meta name="description" content="${description}">`
      );
    } else {
      content = content.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${description}">`
      );
    }

    return content;
  }

  fixHeadings(content) {
    // Ensure proper heading hierarchy
    let currentLevel = 0;
    const headingOrder = [];

    // Find all headings
    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || [];

    for (const heading of headings) {
      const level = parseInt(heading.match(/<h([1-6])/)[1]);
      headingOrder.push(level);
    }

    // Fix heading levels if needed
    for (let i = 0; i < headingOrder.length; i++) {
      if (i === 0 && headingOrder[i] !== 1) {
        // First heading should be h1
        content = content.replace(
          /<h[1-6]([^>]*)>.*?<\/h[1-6]>/,
          (match, attrs) => `<h1${attrs}>${match.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/)[1]}</h1>`
        );
      } else if (headingOrder[i] - headingOrder[i - 1] > 1) {
        // Fix skipped levels
        const newLevel = headingOrder[i - 1] + 1;
        content = content.replace(
          new RegExp(`<h${headingOrder[i]}([^>]*)>.*?<\/h${headingOrder[i]}>`),
          (match, attrs) =>
            `<h${newLevel}${attrs}>${match.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/)[1]}</h${newLevel}>`
        );
      }
    }

    return content;
  }

  fixFloatingButtons(content) {
    // Remove floating buttons if they appear after the footer
    return content.replace(
      /<\/footer>[\s\S]*?<div class="floating-buttons">[\s\S]*?<\/div>/g,
      '</footer>'
    );
  }

  getPageTitle(fileName) {
    const titles = {
      index: 'Holliday Lawn & Garden - Professional Landscaping Services',
      about: 'About Us - Holliday Lawn & Garden',
      services: 'Our Services - Holliday Lawn & Garden',
      contact: 'Contact Us - Holliday Lawn & Garden',
      gallery: 'Our Work - Holliday Lawn & Garden',
      faq: 'Frequently Asked Questions - Holliday Lawn & Garden',
      privacy: 'Privacy Policy - Holliday Lawn & Garden',
      terms: 'Terms of Service - Holliday Lawn & Garden',
      accessibility: 'Accessibility Statement - Holliday Lawn & Garden',
    };
    return titles[fileName] || 'Holliday Lawn & Garden';
  }

  getPageDescription(fileName) {
    const descriptions = {
      index:
        'Professional landscaping and garden services in your area. Quality work, competitive prices, and exceptional customer service.',
      about:
        "Learn about Holliday Lawn & Garden's commitment to excellence in landscaping and garden services.",
      services:
        'Explore our comprehensive range of landscaping and garden services tailored to your needs.',
      contact:
        'Get in touch with Holliday Lawn & Garden for all your landscaping and garden service needs.',
      gallery: 'View our portfolio of landscaping and garden projects showcasing our quality work.',
      faq: 'Find answers to common questions about our landscaping and garden services.',
      privacy: 'Read our privacy policy to understand how we protect your personal information.',
      terms: 'Review our terms of service for landscaping and garden maintenance.',
      accessibility: 'Learn about our commitment to web accessibility and inclusive design.',
    };
    return descriptions[fileName] || 'Professional landscaping and garden services in your area.';
  }

  findFiles(dir, extensions) {
    let results = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extensions));
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }

    return results;
  }
}

// Run the audit
const auditor = new FinalAudit();
auditor.audit();
