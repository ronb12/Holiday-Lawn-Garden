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
          r = this.createModuleContent(s, t),
          n = path.join(this.modulesDir, `${t}.js`);
        fs.writeFileSync(n, r);
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
    const r = fs.readdirSync(s);
    for (const n of r) {
      const r = path.join(s, n);
      fs.statSync(r).isDirectory()
        ? (t = t.concat(this.findFiles(r, e)))
        : e.some(s => n.endsWith(s)) && t.push(r);
    }
    return t;
  }
}
const modularizer = new Modularizer();
modularizer.modularize();
export { and, Modularizer, declarations };
