const fs = require('fs'),
  path = require('path');
class MetaEnhancer {
  constructor() {
    (this.htmlDir = '.'), (this.faviconPath = 'assets/images/favicon.ico');
  }
  async enhance() {
    const e = this.findFiles(this.htmlDir, ['.html']);
    for (const a of e)
      try {
        let e = fs.readFileSync(a, 'utf8');
        (e = this.addMetaDescription(e, a)),
          (e = this.addFavicon(e)),
          (e = this.addOpenGraphTags(e, a)),
          (e = this.addTwitterCardTags(e, a)),
          fs.writeFileSync(a, e);
      } catch (e) {}
  }
  addMetaDescription(e, a) {
    const n = path.basename(a, '.html'),
      r = this.getPageTitle(n),
      t = this.generateDescription(n, r);
    if (!e.includes('<meta name="description"')) {
      const a = `<meta name="description" content="${t}">`;
      return e.replace('</head>', `${a}\n</head>`);
    }
    return e;
  }
  addFavicon(e) {
    if (!e.includes('<link rel="icon"')) {
      const a = `<link rel="icon" type="image/x-icon" href="${this.faviconPath}">`;
      return e.replace('</head>', `${a}\n</head>`);
    }
    return e;
  }
  addOpenGraphTags(e, a) {
    const n = path.basename(a, '.html'),
      r = this.getPageTitle(n),
      t = this.generateDescription(n, r);
    if (!e.includes('og:title')) {
      const a = `\n        <meta property="og:title" content="${r}">\n        <meta property="og:description" content="${t}">\n        <meta property="og:type" content="website">\n        <meta property="og:url" content="https://hollidaylawngarden.com/${n}">\n        <meta property="og:image" content="https://hollidaylawngarden.com/assets/images/hollidays-logo.png">\n      `;
      return e.replace('</head>', `${a}\n</head>`);
    }
    return e;
  }
  addTwitterCardTags(e, a) {
    const n = path.basename(a, '.html'),
      r = this.getPageTitle(n),
      t = this.generateDescription(n, r);
    if (!e.includes('twitter:card')) {
      const a = `\n        <meta name="twitter:card" content="summary_large_image">\n        <meta name="twitter:title" content="${r}">\n        <meta name="twitter:description" content="${t}">\n        <meta name="twitter:image" content="https://hollidaylawngarden.com/assets/images/hollidays-logo.png">\n      `;
      return e.replace('</head>', `${a}\n</head>`);
    }
    return e;
  }
  getPageTitle(e) {
    return (
      {
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
      }[e] || 'Holliday Lawn & Garden'
    );
  }
  generateDescription(e, a) {
    return (
      {
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
      }[e] || 'Professional lawn care and landscaping services in your area.'
    );
  }
  findFiles(e, a) {
    let n = [];
    const r = fs.readdirSync(e);
    for (const t of r) {
      const r = path.join(e, t);
      fs.statSync(r).isDirectory()
        ? (n = n.concat(this.findFiles(r, a)))
        : a.some(e => t.endsWith(e)) && n.push(r);
    }
    return n;
  }
}
const enhancer = new MetaEnhancer();
enhancer.enhance();
