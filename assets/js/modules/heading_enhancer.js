// heading_enhancer.js
const fs = require('fs');
const path = require('path');

class HeadingEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhanceHeadings() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Fix heading hierarchy
        content = this.fixHeadingHierarchy(content);

        // Add missing headings
        content = this.addMissingHeadings(content, file);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  fixHeadingHierarchy(content) {
    // Get all headings
    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || [];
    let lastLevel = 0;
    let newContent = content;

    for (const heading of headings) {
      const level = parseInt(heading.match(/<h([1-6])/)[1]);

      // Skip if heading level is appropriate
      if (level <= lastLevel + 1) {
        lastLevel = level;
        continue;
      }

      // Fix heading level
      const fixedLevel = lastLevel + 1;
      const fixedHeading = heading.replace(/<h[1-6]/, `<h${fixedLevel}`);
      newContent = newContent.replace(heading, fixedHeading);
      lastLevel = fixedLevel;
    }

    return newContent;
  }

  addMissingHeadings(content, file) {
    const fileName = path.basename(file, '.html');

    // Add main heading if missing
    if (!content.includes('<h1')) {
      const title = this.getTitle(fileName);
      const mainHeading = `<h1 class="main-heading">${title}</h1>`;

      // Find appropriate location to insert heading
      if (content.includes('<main>')) {
        content = content.replace('<main>', `<main>\n    ${mainHeading}`);
      } else if (content.includes('<div class="content">')) {
        content = content.replace(
          '<div class="content">',
          `<div class="content">\n    ${mainHeading}`
        );
      }
    }

    // Add section headings if missing
    const sections = content.match(/<section[^>]*>/g) || [];
    for (const section of sections) {
      const sectionContent = content.substring(
        content.indexOf(section),
        content.indexOf('</section>', content.indexOf(section))
      );

      if (!sectionContent.includes('<h2')) {
        const sectionTitle = this.getSectionTitle(section);
        const sectionHeading = `<h2 class="section-heading">${sectionTitle}</h2>`;
        content = content.replace(section, `${section}\n    ${sectionHeading}`);
      }
    }

    return content;
  }

  getTitle(fileName) {
    const titles = {
      index: 'Welcome to Holliday Lawn & Garden',
      about: 'About Holliday Lawn & Garden',
      services: 'Our Professional Services',
      contact: 'Contact Holliday Lawn & Garden',
      gallery: 'Our Work Gallery',
      login: 'Login to Your Account',
      register: 'Create Your Account',
      dashboard: 'Your Dashboard',
      profile: 'Your Profile',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    };

    return titles[fileName] || 'Holliday Lawn & Garden';
  }

  getSectionTitle(section) {
    const sectionClasses = section.match(/class="([^"]*)"/)?.[1] || '';

    const titles = {
      hero: 'Professional Lawn Care Services',
      services: 'Our Services',
      about: 'About Us',
      testimonials: 'What Our Clients Say',
      contact: 'Get in Touch',
      gallery: 'Our Work',
      cta: 'Ready to Get Started?',
      footer: 'Contact Information',
    };

    return titles[sectionClasses] || 'Section';
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

// Run the enhancer
const enhancer = new HeadingEnhancer();
enhancer.enhanceHeadings();

export { HeadingEnhancer };
