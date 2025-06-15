const fs = require('fs'),
  path = require('path');
class AccessibilityEnhancer {
  constructor() {
    this.htmlDir = '.';
  }
  async enhance() {
    const e = this.findFiles(this.htmlDir, ['.html']);
    for (const a of e)
      try {
        let e = fs.readFileSync(a, 'utf8');
        (e = this.enhanceFormElements(e)),
          (e = this.enhanceInteractiveElements(e)),
          (e = this.enhanceImages(e)),
          (e = this.enhanceNavigation(e)),
          fs.writeFileSync(a, e);
      } catch (e) {}
  }
  enhanceFormElements(e) {
    return (e = (e = e.replace(/<input([^>]*)>/g, (e, a) => {
      if (!a.includes('aria-label') && !a.includes('aria-labelledby')) {
        const e = a.match(/type="([^"]*)"/)?.[1] || 'text',
          t = a.match(/placeholder="([^"]*)"/)?.[1] || '';
        if (!(a.match(/id="([^"]*)"/)?.[1] || '')) {
          return `<input${a} id="${`input-${Math.random().toString(36).substr(2, 9)}`}" aria-label="${t || e}">`;
        }
        return `<input${a} aria-label="${t || e}">`;
      }
      return e;
    })).replace(/<textarea([^>]*)>/g, (e, a) => {
      if (!a.includes('aria-label') && !a.includes('aria-labelledby')) {
        const e = a.match(/placeholder="([^"]*)"/)?.[1] || 'Text area';
        if (!(a.match(/id="([^"]*)"/)?.[1] || '')) {
          return `<textarea${a} id="${`textarea-${Math.random().toString(36).substr(2, 9)}`}" aria-label="${e}">`;
        }
        return `<textarea${a} aria-label="${e}">`;
      }
      return e;
    }));
  }
  enhanceInteractiveElements(e) {
    return (e = (e = e.replace(/<button([^>]*)>/g, (e, a) => {
      if (!a.includes('aria-label') && !a.includes('aria-labelledby')) {
        return `<button${a} aria-label="${(e.match(/<button[^>]*>(.*?)<\/button>/)?.[1] || 'Button').trim()}">`;
      }
      return e;
    })).replace(/<a([^>]*)>/g, (e, a) => {
      if (!a.includes('aria-label') && !a.includes('aria-labelledby')) {
        return `<a${a} aria-label="${(e.match(/<a[^>]*>(.*?)<\/a>/)?.[1] || 'Link').trim()}">`;
      }
      return e;
    }));
  }
  enhanceImages(e) {
    return (e = e.replace(/<img([^>]*)>/g, (e, a) => {
      if (!a.includes('alt=')) {
        const e = a.match(/src="([^"]*)"/)?.[1] || '';
        return `<img${a} alt="${path
          .basename(e, path.extname(e))
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, e => e.toUpperCase())}">`;
      }
      return e;
    }));
  }
  enhanceNavigation(e) {
    return (e = (e = e.replace(/<nav([^>]*)>/g, (e, a) =>
      a.includes('aria-label') ? e : `<nav${a} aria-label="Main navigation">`
    )).replace(
      /<a([^>]*)class="([^"]*active[^"]*)"([^>]*)>/g,
      (e, a, t, n) => `<a${a}class="${t}"${n} aria-current="page">`
    ));
  }
  findFiles(e, a) {
    let t = [];
    const n = fs.readdirSync(e);
    for (const r of n) {
      const n = path.join(e, r);
      fs.statSync(n).isDirectory()
        ? (t = t.concat(this.findFiles(n, a)))
        : a.some(e => r.endsWith(e)) && t.push(n);
    }
    return t;
  }
}
const enhancer = new AccessibilityEnhancer();
enhancer.enhance();
