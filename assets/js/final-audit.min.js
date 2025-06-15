const fs = require('fs'),
  path = require('path');
class FinalAudit {
  constructor() {
    this.htmlDir = '.';
  }
  async audit() {
    const e = this.findFiles(this.htmlDir, ['.html']);
    for (const a of e)
      try {
        let e = fs.readFileSync(a, 'utf8');
        (e = this.fixImages(e)),
          (e = this.fixMetaTags(e, a)),
          (e = this.fixHeadings(e)),
          (e = this.fixFloatingButtons(e)),
          fs.writeFileSync(a, e);
      } catch (e) {}
  }
  fixImages(e) {
    return e.replace(
      /<img([^>]*)src="([^"]*\.(jpg|jpeg|png))"([^>]*)>/g,
      (e, a, n, i, t) =>
        `\n        <picture>\n          <source srcset="${n.replace(/\.(jpg|jpeg|png)$/, '.webp')}" type="image/webp">\n          <img${a}src="${n}"${t} loading="lazy">\n        </picture>`
    );
  }
  fixMetaTags(e, a) {
    const n = path.basename(a, '.html'),
      i = this.getPageTitle(n),
      t = this.getPageDescription(n);
    return (e = (e = e.includes('<title>')
      ? e.replace(/<title>.*?<\/title>/, `<title>${i}</title>`)
      : e.replace(/<head>/, `<head>\n    <title>${i}</title>`)).includes('meta name="description"')
      ? e.replace(
          /<meta name="description" content=".*?">/,
          `<meta name="description" content="${t}">`
        )
      : e.replace(/<head>/, `<head>\n    <meta name="description" content="${t}">`));
  }
  fixHeadings(e) {
    const a = [],
      n = e.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || [];
    for (const e of n) {
      const n = parseInt(e.match(/<h([1-6])/)[1]);
      a.push(n);
    }
    for (let n = 0; n < a.length; n++)
      if (0 === n && 1 !== a[n])
        e = e.replace(
          /<h[1-6]([^>]*)>.*?<\/h[1-6]>/,
          (e, a) => `<h1${a}>${e.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/)[1]}</h1>`
        );
      else if (a[n] - a[n - 1] > 1) {
        const i = a[n - 1] + 1;
        e = e.replace(
          new RegExp(`<h${a[n]}([^>]*)>.*?</h${a[n]}>`),
          (e, a) => `<h${i}${a}>${e.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/)[1]}</h${i}>`
        );
      }
    return e;
  }
  fixFloatingButtons(e) {
    return e.replace(
      /<\/footer>[\s\S]*?<div class="floating-buttons">[\s\S]*?<\/div>/g,
      '</footer>'
    );
  }
  getPageTitle(e) {
    return (
      {
        index: 'Holliday Lawn & Garden - Professional Landscaping Services',
        about: 'About Us - Holliday Lawn & Garden',
        services: 'Our Services - Holliday Lawn & Garden',
        contact: 'Contact Us - Holliday Lawn & Garden',
        gallery: 'Our Work - Holliday Lawn & Garden',
        faq: 'Frequently Asked Questions - Holliday Lawn & Garden',
        privacy: 'Privacy Policy - Holliday Lawn & Garden',
        terms: 'Terms of Service - Holliday Lawn & Garden',
        accessibility: 'Accessibility Statement - Holliday Lawn & Garden',
      }[e] || 'Holliday Lawn & Garden'
    );
  }
  getPageDescription(e) {
    return (
      {
        index:
          'Professional landscaping and garden services in your area. Quality work, competitive prices, and exceptional customer service.',
        about:
          "Learn about Holliday Lawn & Garden's commitment to excellence in landscaping and garden services.",
        services:
          'Explore our comprehensive range of landscaping and garden services tailored to your needs.',
        contact:
          'Get in touch with Holliday Lawn & Garden for all your landscaping and garden service needs.',
        gallery:
          'View our portfolio of landscaping and garden projects showcasing our quality work.',
        faq: 'Find answers to common questions about our landscaping and garden services.',
        privacy: 'Read our privacy policy to understand how we protect your personal information.',
        terms: 'Review our terms of service for landscaping and garden maintenance.',
        accessibility: 'Learn about our commitment to web accessibility and inclusive design.',
      }[e] || 'Professional landscaping and garden services in your area.'
    );
  }
  findFiles(e, a) {
    let n = [];
    const i = fs.readdirSync(e);
    for (const t of i) {
      const i = path.join(e, t);
      fs.statSync(i).isDirectory()
        ? (n = n.concat(this.findFiles(i, a)))
        : a.some(e => t.endsWith(e)) && n.push(i);
    }
    return n;
  }
}
const auditor = new FinalAudit();
auditor.audit();
