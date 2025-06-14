const fs = require('fs');
const path = require('path');

class ResourceUpdater {
  constructor() {
    this.htmlDir = '.';
  }

  async updateResources() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to update`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Update CSS links
        content = this.updateCSSLinks(content);
        
        // Update JavaScript sources
        content = this.updateJSSources(content);
        
        // Update image sources
        content = this.updateImageSources(content);
        
        // Add resource hints
        content = this.addResourceHints(content);
        
        fs.writeFileSync(file, content);
        console.log(`✓ Updated ${file}`);
      } catch (error) {
        console.error(`Error updating ${file}:`, error);
      }
    }
  }

  updateCSSLinks(content) {
    return content.replace(
      /<link[^>]*href="([^"]*\.css)"[^>]*>/g,
      (match, href) => {
        if (href.includes('.min.css')) return match;
        const minHref = href.replace('.css', '.min.css');
        return match.replace(href, minHref);
      }
    );
  }

  updateJSSources(content) {
    return content.replace(
      /<script[^>]*src="([^"]*\.js)"[^>]*>/g,
      (match, src) => {
        if (src.includes('.min.js')) return match;
        const minSrc = src.replace('.js', '.min.js');
        return match.replace(src, minSrc);
      }
    );
  }

  updateImageSources(content) {
    return content.replace(
      /<img[^>]*src="([^"]*\.(jpg|jpeg|png))"[^>]*>/g,
      (match, src) => {
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
        return match.replace(src, webpSrc);
      }
    );
  }

  addResourceHints(content) {
    const hints = [
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link rel="dns-prefetch" href="https://fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="https://fonts.gstatic.com">'
    ].join('\n    ');

    return content.replace(
      /<head>/,
      `<head>\n    ${hints}`
    );
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
const updater = new ResourceUpdater();
updater.updateResources(); 