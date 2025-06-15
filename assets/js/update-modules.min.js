const fs = require('fs'),
  path = require('path');
class ModuleUpdater {
  constructor() {
    (this.htmlDir = '.'), (this.modulesDir = 'assets/js/modules');
  }
  async updateModules() {
    const t = this.findFiles(this.htmlDir, ['.html']);
    for (const s of t)
      try {
        let t = fs.readFileSync(s, 'utf8');
        (t = this.updateScriptTags(t)), (t = this.addModuleImports(t)), fs.writeFileSync(s, t);
      } catch (t) {}
  }
  updateScriptTags(t) {
    return t.replace(/<script([^>]*)>/g, (t, s) =>
      s.includes('type="module"') ? t : `<script${s} type="module">`
    );
  }
  addModuleImports(t) {
    const s = this.getModules()
      .map(t => {
        const s = path.basename(t, '.js');
        return `import { ${this.getModuleExports(t)} } from '/${this.modulesDir}/${s}.js';`;
      })
      .join('\n    ');
    return t.replace(/<script[^>]*type="module"[^>]*>/, t => `${t}\n    ${s}`);
  }
  getModules() {
    return fs.existsSync(this.modulesDir)
      ? fs.readdirSync(this.modulesDir).filter(t => t.endsWith('.js'))
      : [];
  }
  getModuleExports(t) {
    const s = fs.readFileSync(path.join(this.modulesDir, t), 'utf8');
    return (s.match(/export\s*{([^}]*)}/)?.[1] || '')
      .split(',')
      .map(t => t.trim())
      .join(', ');
  }
  findFiles(t, s) {
    let e = [];
    const r = fs.readdirSync(t);
    for (const i of r) {
      const r = path.join(t, i);
      fs.statSync(r).isDirectory()
        ? (e = e.concat(this.findFiles(r, s)))
        : s.some(t => i.endsWith(t)) && e.push(r);
    }
    return e;
  }
}
const updater = new ModuleUpdater();
updater.updateModules();
