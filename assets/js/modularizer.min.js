const fs = require('fs'),
  path = require('path');
class Modularizer {
  constructor() {
    (this.jsDir = 'assets/js'), (this.modulesDir = 'assets/js/modules');
  }
  async modularize() {
    fs.existsSync(this.modulesDir) || fs.mkdirSync(this.modulesDir, { recursive: !0 });
    const s = this.findFiles(this.jsDir, ['.js']);
    for (const e of s)
      try {
        if (e.includes('modules/')) continue;
        const s = fs.readFileSync(e, 'utf8'),
          t = this.getModuleName(e),
          n = this.createModuleContent(s, t),
          r = path.join(this.modulesDir, `${t}.js`);
        fs.writeFileSync(r, n);
      } catch (s) {}
  }
  getModuleName(s) {
    return path.basename(s, '.js').replace(/-/g, '_');
  }
  createModuleContent(s, e) {
    return `\n// ${e}.js\n${s}\n\nexport {\n  ${this.getExports(s)}\n};\n`;
  }
  getExports(s) {
    const e = s.match(/function\s+(\w+)/g) || [],
      t = s.match(/class\s+(\w+)/g) || [];
    return [...e.map(s => s.replace('function ', '')), ...t.map(s => s.replace('class ', ''))].join(
      ',\n  '
    );
  }
  findFiles(s, e) {
    let t = [];
    const n = fs.readdirSync(s);
    for (const r of n) {
      const n = path.join(s, r);
      fs.statSync(n).isDirectory()
        ? (t = t.concat(this.findFiles(n, e)))
        : e.some(s => r.endsWith(s)) && t.push(n);
    }
    return t;
  }
}
const modularizer = new Modularizer();
modularizer.modularize();
