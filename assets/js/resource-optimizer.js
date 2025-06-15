const fs = require('fs');
const path = require('path');

class ResourceOptimizer {
  constructor() {
    this.htmlDir = '.';
  }

  async optimizeResources() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to optimize`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add resource hints
        content = this.addResourceHints(content);

        // Optimize script loading
        content = this.optimizeScriptLoading(content);

        // Optimize style loading
        content = this.optimizeStyleLoading(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Optimized ${file}`);
      } catch (error) {
        console.error(`Error optimizing ${file}:`, error);
      }
    }
  }

  addResourceHints(content) {
    const hints = [
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="dns-prefetch" href="https://fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="https://fonts.gstatic.com">',
      '<link rel="preconnect" href="https://cdn.jsdelivr.net">',
      '<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">',
    ].join('\n    ');

    return content.replace(/<head>/, `<head>\n    ${hints}`);
  }

  optimizeScriptLoading(content) {
    return content.replace(/<script([^>]*)>/g, (match, attrs) => {
      // Skip if already has async or defer
      if (attrs.includes('async') || attrs.includes('defer')) {
        return match;
      }

      // Add defer to non-critical scripts
      if (!attrs.includes('critical')) {
        return `<script${attrs} defer>`;
      }

      return match;
    });
  }

  optimizeStyleLoading(content) {
    return content.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, match => {
      // Add preload for critical styles
      if (match.includes('critical')) {
        const hrefMatch = match.match(/href="([^"]*)"/);
        if (hrefMatch) {
          const href = hrefMatch[1];
          return `
    <link rel="preload" href="${href}" as="style">
    ${match}`;
        }
      }
      return match;
    });
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

// Run the optimizer
const optimizer = new ResourceOptimizer();
optimizer.optimizeResources();
