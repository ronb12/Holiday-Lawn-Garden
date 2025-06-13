
// minifier.js
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const Terser = require('terser');

class Minifier {
  constructor() {
    this.cssDir = 'assets/styles';
    this.jsDir = 'assets/js';
  }

  async minifyAll() {
    await this.minifyCSS();
    await this.minifyJS();
  }

  async minifyCSS() {
    const cssFiles = this.findFiles(this.cssDir, ['.css']);
    console.log(`Found ${cssFiles.length} CSS files to minify`);

    for (const file of cssFiles) {
      try {
        const css = fs.readFileSync(file, 'utf8');
        const minified = new CleanCSS({
          level: 2,
          format: 'keep-breaks'
        }).minify(css);

        const minPath = this.getMinPath(file);
        fs.writeFileSync(minPath, minified.styles);
        console.log(`✓ Minified ${file}`);
      } catch (error) {
        console.error(`Error minifying ${file}:`, error);
      }
    }
  }

  async minifyJS() {
    const jsFiles = this.findFiles(this.jsDir, ['.js']);
    console.log(`Found ${jsFiles.length} JS files to minify`);

    for (const file of jsFiles) {
      try {
        const code = fs.readFileSync(file, 'utf8');
        const minified = await Terser.minify(code, {
          compress: true,
          mangle: true,
          format: {
            comments: false
          }
        });

        const minPath = this.getMinPath(file);
        fs.writeFileSync(minPath, minified.code);
        console.log(`✓ Minified ${file}`);
      } catch (error) {
        console.error(`Error minifying ${file}:`, error);
      }
    }
  }

  getMinPath(file) {
    const dir = path.dirname(file);
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    return path.join(dir, `${name}.min${ext}`);
  }

  findFiles(dir, extensions) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extensions));
      } else if (extensions.some(ext => file.endsWith(ext)) && !file.includes('.min.')) {
        results.push(filePath);
      }
    }
    
    return results;
  }
}

// Run the minifier
const minifier = new Minifier();
minifier.minifyAll(); 

export {
  Minifier
};
