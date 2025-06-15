const fs = require('fs'),
  path = require('path');
class MetaEnhancer {
  constructor() {
    this.htmlDir = '.';
  }
  async enhanceMeta() {
    const e = this.findFiles(this.htmlDir, ['.html']);
    for (const a of e)
      try {
        let e = fs.readFileSync(a, 'utf8');
        (e = this.addMetaTags(e, a)), (e = this.addFavicon(e)), fs.writeFileSync(a, e);
      } catch (e) {}
  }
  addMetaTags(e, a) {
    const n = path.basename(a, '.html'),
      t = this.getTitle(n),
      r = this.getDescription(n),
      i = `\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="description" content="${r}">\n    <meta name="keywords" content="lawn care, garden services, landscaping, ${n}">\n    <meta name="author" content="Holliday Lawn & Garden">\n    <meta name="robots" content="index, follow">\n    <meta property="og:title" content="${t}">\n    <meta property="og:description" content="${r}">\n    <meta property="og:type" content="website">\n    <meta property="og:url" content="https://hollidaylawngarden.com/${n}">\n    <meta property="og:image" content="https://hollidaylawngarden.com/assets/images/og-image.jpg">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${t}">\n    <meta name="twitter:description" content="${r}">\n    <meta name="twitter:image" content="https://hollidaylawngarden.com/assets/images/og-image.jpg">\n    <link rel="canonical" href="https://hollidaylawngarden.com/${n}">`;
    return e.replace(/<head>/, `<head>${i}`);
  }
  addFavicon(e) {
    return e.replace(
      /<head>/,
      '<head>\n    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/favicon/apple-touch-icon.png">\n    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon/favicon-32x32.png">\n    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon/favicon-16x16.png">\n    <link rel="manifest" href="/site.webmanifest">\n    <link rel="mask-icon" href="/assets/images/favicon/safari-pinned-tab.svg" color="#5bbad5">\n    <meta name="msapplication-TileColor" content="#da532c">\n    <meta name="theme-color" content="#ffffff">'
    );
  }
  getTitle(e) {
    return (
      {
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
      }[e] || `Holliday Lawn & Garden - ${e.charAt(0).toUpperCase() + e.slice(1)}`
    );
  }
  getDescription(e) {
    return (
      {
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
      }[e] || 'Professional lawn care and garden services by Holliday Lawn & Garden.'
    );
  }
  findFiles(e, a) {
    let n = [];
    const t = fs.readdirSync(e);
    for (const r of t) {
      const t = path.join(e, r);
      fs.statSync(t).isDirectory()
        ? (n = n.concat(this.findFiles(t, a)))
        : a.some(e => r.endsWith(e)) && n.push(t);
    }
    return n;
  }
}
const enhancer = new MetaEnhancer();
enhancer.enhanceMeta();
export { MetaEnhancer };
