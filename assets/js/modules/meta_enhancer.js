// meta_enhancer.js
const fs = require('fs');
const path = require('path');

class MetaEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhanceMeta() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add meta tags
        content = this.addMetaTags(content, file);

        // Add favicon
        content = this.addFavicon(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  addMetaTags(content, file) {
    const fileName = path.basename(file, '.html');
    const title = this.getTitle(fileName);
    const description = this.getDescription(fileName);

    const metaTags = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <meta name="keywords" content="lawn care, garden services, landscaping, ${fileName}">
    <meta name="author" content="Holliday Lawn & Garden">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://hollidaylawngarden.com/${fileName}">
    <meta property="og:image" content="https://hollidaylawngarden.com/assets/images/og-image.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="https://hollidaylawngarden.com/assets/images/og-image.jpg">
    <link rel="canonical" href="https://hollidaylawngarden.com/${fileName}">`;

    return content.replace(/<head>/, `<head>${metaTags}`);
  }

  addFavicon(content) {
    const faviconTags = `
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/favicon/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/assets/images/favicon/safari-pinned-tab.svg" color="#5bbad5">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="theme-color" content="#ffffff">`;

    return content.replace(/<head>/, `<head>${faviconTags}`);
  }

  getTitle(fileName) {
    const titles = {
      index: 'Holliday Lawn & Garden - Professional Lawn Care Services',
      about: 'About Us - Holliday Lawn & Garden',
      services: 'Our Services - Holliday Lawn & Garden',
      contact: 'Contact Us - Holliday Lawn & Garden',
      gallery: 'Our Work - Holliday Lawn & Garden Gallery',
      login: 'Login - Holliday Lawn & Garden',
      register: 'Register - Holliday Lawn & Garden',
      dashboard: 'Dashboard - Holliday Lawn & Garden',
      profile: 'My Profile - Holliday Lawn & Garden',
      privacy: 'Privacy Policy - Holliday Lawn & Garden',
      terms: 'Terms of Service - Holliday Lawn & Garden',
    };

    return (
      titles[fileName] ||
      `Holliday Lawn & Garden - ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}`
    );
  }

  getDescription(fileName) {
    const descriptions = {
      index:
        'Professional lawn care and garden services in your area. Quality landscaping, maintenance, and design services for your home or business.',
      about:
        "Learn about Holliday Lawn & Garden's commitment to excellence in lawn care and landscaping services.",
      services:
        'Explore our comprehensive range of lawn care and landscaping services tailored to your needs.',
      contact:
        'Get in touch with Holliday Lawn & Garden for all your lawn care and landscaping needs.',
      gallery: 'View our portfolio of successful lawn care and landscaping projects.',
      login: 'Access your Holliday Lawn & Garden account to manage your services.',
      register: 'Create your Holliday Lawn & Garden account to access our services.',
      dashboard: 'Manage your lawn care services and account settings.',
      profile: 'Update your personal information and service preferences.',
      privacy: 'Read our privacy policy to understand how we protect your information.',
      terms: 'Review our terms of service for using Holliday Lawn & Garden services.',
    };

    return (
      descriptions[fileName] ||
      'Professional lawn care and garden services by Holliday Lawn & Garden.'
    );
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
const enhancer = new MetaEnhancer();
enhancer.enhanceMeta();

export { MetaEnhancer };
