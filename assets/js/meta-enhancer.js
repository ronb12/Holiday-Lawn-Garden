const fs = require('fs');
const path = require('path');

class MetaEnhancer {
  constructor() {
    this.htmlDir = '.';
    this.faviconPath = 'assets/images/favicon.ico';
  }

  async enhance() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add meta description
        content = this.addMetaDescription(content, file);

        // Add favicon
        content = this.addFavicon(content);

        // Add Open Graph tags
        content = this.addOpenGraphTags(content, file);

        // Add Twitter Card tags
        content = this.addTwitterCardTags(content, file);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  addMetaDescription(content, file) {
    const fileName = path.basename(file, '.html');
    const title = this.getPageTitle(fileName);
    const description = this.generateDescription(fileName, title);

    if (!content.includes('<meta name="description"')) {
      const metaDescription = `<meta name="description" content="${description}">`;
      return content.replace('</head>', `${metaDescription}\n</head>`);
    }

    return content;
  }

  addFavicon(content) {
    if (!content.includes('<link rel="icon"')) {
      const faviconLink = `<link rel="icon" type="image/x-icon" href="${this.faviconPath}">`;
      return content.replace('</head>', `${faviconLink}\n</head>`);
    }

    return content;
  }

  addOpenGraphTags(content, file) {
    const fileName = path.basename(file, '.html');
    const title = this.getPageTitle(fileName);
    const description = this.generateDescription(fileName, title);

    if (!content.includes('og:title')) {
      const ogTags = `
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://hollidaylawngarden.com/${fileName}">
        <meta property="og:image" content="https://hollidaylawngarden.com/assets/images/hollidays-logo.png">
      `;
      return content.replace('</head>', `${ogTags}\n</head>`);
    }

    return content;
  }

  addTwitterCardTags(content, file) {
    const fileName = path.basename(file, '.html');
    const title = this.getPageTitle(fileName);
    const description = this.generateDescription(fileName, title);

    if (!content.includes('twitter:card')) {
      const twitterTags = `
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="https://hollidaylawngarden.com/assets/images/hollidays-logo.png">
      `;
      return content.replace('</head>', `${twitterTags}\n</head>`);
    }

    return content;
  }

  getPageTitle(fileName) {
    const titles = {
      index: 'Holliday Lawn & Garden - Professional Landscaping Services',
      about: 'About Holliday Lawn & Garden - Our Story and Mission',
      services: 'Our Services - Professional Lawn Care and Landscaping',
      contact: 'Contact Holliday Lawn & Garden - Get in Touch',
      gallery: 'Our Work - Holliday Lawn & Garden Portfolio',
      testimonials: 'Customer Testimonials - Holliday Lawn & Garden Reviews',
      faq: 'Frequently Asked Questions - Holliday Lawn & Garden',
      privacy: 'Privacy Policy - Holliday Lawn & Garden',
      terms: 'Terms of Service - Holliday Lawn & Garden',
      login: 'Login - Holliday Lawn & Garden Customer Portal',
      register: 'Register - Create Your Holliday Lawn & Garden Account',
      profile: 'My Profile - Holliday Lawn & Garden Customer Portal',
      dashboard: 'Customer Dashboard - Holliday Lawn & Garden',
      admin: 'Admin Dashboard - Holliday Lawn & Garden',
      pay: 'Pay Your Bill - Holliday Lawn & Garden',
      receipt: 'Payment Receipt - Holliday Lawn & Garden',
      education: 'Lawn Care Education - Holliday Lawn & Garden',
      sitemap: 'Sitemap - Holliday Lawn & Garden',
      offline: 'Offline - Holliday Lawn & Garden',
      error: 'Error - Holliday Lawn & Garden',
      404: 'Page Not Found - Holliday Lawn & Garden',
    };

    return titles[fileName] || 'Holliday Lawn & Garden';
  }

  generateDescription(fileName, title) {
    const descriptions = {
      index:
        'Professional lawn care and landscaping services in your area. Get expert lawn maintenance, garden design, and outdoor living solutions.',
      about:
        "Learn about Holliday Lawn & Garden's commitment to excellence in lawn care and landscaping. Discover our story, mission, and values.",
      services:
        "Explore our comprehensive lawn care and landscaping services. From lawn maintenance to garden design, we've got you covered.",
      contact:
        'Get in touch with Holliday Lawn & Garden. Contact us for a free consultation or to schedule our services.',
      gallery:
        'View our portfolio of successful lawn care and landscaping projects. See the quality of our work and get inspired.',
      testimonials:
        'Read what our satisfied customers have to say about our lawn care and landscaping services.',
      faq: 'Find answers to common questions about our lawn care and landscaping services.',
      privacy: 'Read our privacy policy to understand how we protect your personal information.',
      terms: "Review our terms of service for using Holliday Lawn & Garden's services.",
      login:
        'Access your Holliday Lawn & Garden customer account. Manage your services and payments.',
      register:
        'Create your Holliday Lawn & Garden customer account. Get started with our services.',
      profile: 'Manage your Holliday Lawn & Garden customer profile and preferences.',
      dashboard:
        'Access your Holliday Lawn & Garden customer dashboard. View your services and account information.',
      admin: 'Access the Holliday Lawn & Garden admin dashboard. Manage customers and services.',
      pay: 'Pay your Holliday Lawn & Garden bill securely online.',
      receipt: 'View your Holliday Lawn & Garden payment receipt.',
      education:
        'Learn about lawn care and gardening from our experts. Get tips and advice for maintaining your outdoor space.',
      sitemap: 'Navigate the Holliday Lawn & Garden website with our comprehensive sitemap.',
      offline: 'You are currently offline. Please check your internet connection.',
      error: 'An error has occurred. Please try again later.',
      404: 'The page you are looking for could not be found.',
    };

    return (
      descriptions[fileName] || 'Professional lawn care and landscaping services in your area.'
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
enhancer.enhance();
