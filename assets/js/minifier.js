const fs = require('fs');
const path = require('path');
const Terser = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier');

class Minifier {
  constructor() {
    this.jsDir = 'assets/js';
    this.cssDir = 'assets/css';
    this.htmlDir = '.';
  }

  async minify() {
    console.log('Starting minification process...');
    
    // Minify JavaScript files
    await this.minifyJavaScript();
    
    // Minify CSS files
    await this.minifyCSS();
    
    // Minify HTML files
    await this.minifyHTML();
    
    console.log('Minification complete!');
  }

  async minifyJavaScript() {
    const jsFiles = this.findFiles(this.jsDir, ['.js']);
    console.log(`Found ${jsFiles.length} JavaScript files to minify`);

    for (const file of jsFiles) {
      try {
        if (!file.endsWith('.min.js')) {
          const content = fs.readFileSync(file, 'utf8');
          const minified = await Terser.minify(content, {
            compress: {
              drop_console: true,
              drop_debugger: true
            },
            mangle: true,
            format: {
              comments: false
            }
          });

          const minifiedPath = file.replace('.js', '.min.js');
          fs.writeFileSync(minifiedPath, minified.code);
          console.log(`✓ Minified ${file}`);
        }
      } catch (error) {
        console.error(`Error minifying ${file}:`, error);
      }
    }
  }

  async minifyCSS() {
    const cssFiles = this.findFiles(this.cssDir, ['.css']);
    console.log(`Found ${cssFiles.length} CSS files to minify`);

    for (const file of cssFiles) {
      try {
        if (!file.endsWith('.min.css')) {
          const content = fs.readFileSync(file, 'utf8');
          const minified = new CleanCSS({
            level: 2,
            format: 'keep-breaks'
          }).minify(content);

          const minifiedPath = file.replace('.css', '.min.css');
          fs.writeFileSync(minifiedPath, minified.styles);
          console.log(`✓ Minified ${file}`);
        }
      } catch (error) {
        console.error(`Error minifying ${file}:`, error);
      }
    }
  }

  async minifyHTML() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to minify`);

    for (const file of htmlFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const minified = htmlMinifier.minify(content, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          minifyCSS: true,
          minifyJS: true,
          minifyURLs: true
        });

        fs.writeFileSync(file, minified);
        console.log(`✓ Minified ${file}`);
      } catch (error) {
        console.error(`Error minifying ${file}:`, error);
      }
    }
  }

  findFiles(dir, extensions) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extensions));
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
    
    return results;
  }
}

// Run the minifier
const minifier = new Minifier();
minifier.minify(); 