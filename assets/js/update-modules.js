const fs = require('fs');
const path = require('path');

class ModuleUpdater {
  constructor() {
    this.htmlDir = '.';
    this.modulesDir = 'assets/js/modules';
  }

  async updateModules() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to update`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add type="module" to script tags
        content = this.updateScriptTags(content);

        // Add module imports
        content = this.addModuleImports(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Updated ${file}`);
      } catch (error) {
        console.error(`Error updating ${file}:`, error);
      }
    }
  }

  updateScriptTags(content) {
    return content.replace(/<script([^>]*)>/g, (match, attrs) => {
      // Skip if already has type="module"
      if (attrs.includes('type="module"')) {
        return match;
      }

      // Add type="module" to script tags
      return `<script${attrs} type="module">`;
    });
  }

  addModuleImports(content) {
    const modules = this.getModules();
    const imports = modules
      .map(module => {
        const moduleName = path.basename(module, '.js');
        return `import { ${this.getModuleExports(module)} } from '/${this.modulesDir}/${moduleName}.js';`;
      })
      .join('\n    ');

    return content.replace(/<script[^>]*type="module"[^>]*>/, match => {
      return `${match}\n    ${imports}`;
    });
  }

  getModules() {
    if (!fs.existsSync(this.modulesDir)) {
      return [];
    }

    return fs.readdirSync(this.modulesDir).filter(file => file.endsWith('.js'));
  }

  getModuleExports(module) {
    const content = fs.readFileSync(path.join(this.modulesDir, module), 'utf8');
    const exports = content.match(/export\s*{([^}]*)}/)?.[1] || '';
    return exports
      .split(',')
      .map(e => e.trim())
      .join(', ');
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

// Run the updater
const updater = new ModuleUpdater();
updater.updateModules();
