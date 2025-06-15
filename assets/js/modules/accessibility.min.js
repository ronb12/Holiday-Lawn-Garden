const fs = require('fs'),
  path = require('path');
class AccessibilityEnhancer {
  constructor() {
    this.htmlDir = '.';
  }
  async enhanceAccessibility() {
    const a = this.findFiles(this.htmlDir, ['.html']);
    for (const e of a)
      try {
        let a = fs.readFileSync(e, 'utf8');
        (a = this.addButtonLabels(a)),
          (a = this.addFormLabels(a)),
          (a = this.addImageLabels(a)),
          (a = this.addNavigationLabels(a)),
          (a = this.addInteractiveLabels(a)),
          fs.writeFileSync(e, a);
      } catch (a) {}
  }
  addButtonLabels(a) {
    return a.replace(/<button([^>]*)>/g, (a, e) => {
      if (!e.includes('aria-label')) {
        return `<button${e} aria-label="${a.match(/>([^<]*)</)?.[1]?.trim() || 'Button'}">`;
      }
      return a;
    });
  }
  addFormLabels(a) {
    return a.replace(/<form([^>]*)>/g, (a, e) => {
      if (!e.includes('aria-label')) {
        const a = e.match(/id="([^"]*)"/)?.[1] || 'form';
        return `<form${e} aria-label="${a} form">`;
      }
      return a;
    });
  }
  addImageLabels(a) {
    return a.replace(/<img([^>]*)>/g, (a, e) => {
      if (!e.includes('alt=') && !e.includes('aria-label')) {
        const a = (e.match(/src="([^"]*)"/)?.[1] || '')
          .split('/')
          .pop()
          .split('.')[0]
          .replace(/-/g, ' ');
        return `<img${e} alt="${a}" aria-label="${a}">`;
      }
      return a;
    });
  }
  addNavigationLabels(a) {
    return a.replace(/<nav([^>]*)>/g, (a, e) =>
      e.includes('aria-label') ? a : `<nav${e} aria-label="Main navigation">`
    );
  }
  addInteractiveLabels(a) {
    return (a = (a = a.replace(/<a([^>]*)>/g, (a, e) => {
      if (!e.includes('aria-label')) {
        return `<a${e} aria-label="${a.match(/>([^<]*)</)?.[1]?.trim() || 'Link'}">`;
      }
      return a;
    })).replace(/<input([^>]*)>/g, (a, e) => {
      if (!e.includes('aria-label')) {
        const a = e.match(/type="([^"]*)"/)?.[1] || 'input',
          t = e.match(/id="([^"]*)"/)?.[1] || a;
        return `<input${e} aria-label="${t} ${a}">`;
      }
      return a;
    }));
  }
  findFiles(a, e) {
    let t = [];
    const i = fs.readdirSync(a);
    for (const r of i) {
      const i = path.join(a, r);
      fs.statSync(i).isDirectory()
        ? (t = t.concat(this.findFiles(i, e)))
        : e.some(a => r.endsWith(a)) && t.push(i);
    }
    return t;
  }
}
const enhancer = new AccessibilityEnhancer();
enhancer.enhanceAccessibility();
export { AccessibilityEnhancer };
