const fs = require('fs'),
  path = require('path'),
  Terser = require('terser'),
  CleanCSS = require('clean-css'),
  htmlMinifier = require('html-minifier');
class Minifier {
  constructor() {
    (this.jsDir = 'assets/js'), (this.cssDir = 'assets/css'), (this.htmlDir = '.');
  }
  async minify() {
    await this.minifyJavaScript(), await this.minifyCSS(), await this.minifyHTML();
  }
  async minifyJavaScript() {
    const i = this.findFiles(this.jsDir, ['.js']);
    for (const s of i)
      try {
        if (!s.endsWith('.min.js')) {
          const i = fs.readFileSync(s, 'utf8'),
            e = await Terser.minify(i, {
              compress: { drop_console: !0, drop_debugger: !0 },
              mangle: !0,
              format: { comments: !1 },
            }),
            t = s.replace('.js', '.min.js');
          fs.writeFileSync(t, e.code);
        }
      } catch (i) {}
  }
  async minifyCSS() {
    const i = this.findFiles(this.cssDir, ['.css']);
    for (const s of i)
      try {
        if (!s.endsWith('.min.css')) {
          const i = fs.readFileSync(s, 'utf8'),
            e = new CleanCSS({ level: 2, format: 'keep-breaks' }).minify(i),
            t = s.replace('.css', '.min.css');
          fs.writeFileSync(t, e.styles);
        }
      } catch (i) {}
  }
  async minifyHTML() {
    const i = this.findFiles(this.htmlDir, ['.html']);
    for (const s of i)
      try {
        const i = fs.readFileSync(s, 'utf8'),
          e = htmlMinifier.minify(i, {
            collapseWhitespace: !0,
            removeComments: !0,
            removeRedundantAttributes: !0,
            removeScriptTypeAttributes: !0,
            removeStyleLinkTypeAttributes: !0,
            minifyCSS: !0,
            minifyJS: !0,
            minifyURLs: !0,
          });
        fs.writeFileSync(s, e);
      } catch (i) {}
  }
  findFiles(i, s) {
    let e = [];
    const t = fs.readdirSync(i);
    for (const n of t) {
      const t = path.join(i, n);
      fs.statSync(t).isDirectory()
        ? (e = e.concat(this.findFiles(t, s)))
        : s.some(i => n.endsWith(i)) && e.push(t);
    }
    return e;
  }
}
const minifier = new Minifier();
minifier.minify();
