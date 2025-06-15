const fs = require('fs');
const path = require('path');

class Modularizer {
  constructor() {
    this.jsDir = 'assets/js';
    this.modulesDir = 'assets/js/modules';
  }

  async modularize() {
    // Create modules directory if it doesn't exist
    if (!fs.existsSync(this.modulesDir)) {
      fs.mkdirSync(this.modulesDir, { recursive: true });
    }

    // Get all JavaScript files
    const jsFiles = this.findFiles(this.jsDir, ['.js']);
    console.log(`Found ${jsFiles.length} JavaScript files to modularize`);

    for (const file of jsFiles) {
      try {
        // Skip if already in modules directory
        if (file.includes('modules/')) continue;

        const content = fs.readFileSync(file, 'utf8');
        const moduleName = this.getModuleName(file);

        // Create module file
        const moduleContent = this.createModuleContent(content, moduleName);
        const modulePath = path.join(this.modulesDir, `${moduleName}.js`);

        fs.writeFileSync(modulePath, moduleContent);
        console.log(`✓ Created module ${moduleName}`);
      } catch (error) {
        console.error(`Error modularizing ${file}:`, error);
      }
    }
  }

  getModuleName(file) {
    const baseName = path.basename(file, '.js');
    return baseName.replace(/-/g, '_');
  }

  createModuleContent(content, moduleName) {
    // Convert to ES6 module
    const moduleContent = `
// ${moduleName}.js
${content}

export {
  ${this.getExports(content)}
};
`;

    return moduleContent;
  }

  getExports(content) {
    // Find all function and class declarations
    const functions = content.match(/function\s+(\w+)/g) || [];
    const classes = content.match(/class\s+(\w+)/g) || [];

    // Clean up matches
    const exports = [
      ...functions.map(f => f.replace('function ', '')),
      ...classes.map(c => c.replace('class ', '')),
    ];

    return exports.join(',\n  ');
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

// Run the modularizer
const modularizer = new Modularizer();
modularizer.modularize();
