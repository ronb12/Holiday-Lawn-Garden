const fs = require('fs');
const path = require('path');

class AccessibilityEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhanceAccessibility() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Add ARIA labels to buttons
        content = this.addButtonLabels(content);
        
        // Add ARIA labels to forms
        content = this.addFormLabels(content);
        
        // Add ARIA labels to images
        content = this.addImageLabels(content);
        
        // Add ARIA labels to navigation
        content = this.addNavigationLabels(content);
        
        // Add ARIA labels to interactive elements
        content = this.addInteractiveLabels(content);
        
        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  addButtonLabels(content) {
    return content.replace(
      /<button([^>]*)>/g,
      (match, attrs) => {
        if (!attrs.includes('aria-label')) {
          const text = match.match(/>([^<]*)</)?.[1]?.trim() || 'Button';
          return `<button${attrs} aria-label="${text}">`;
        }
        return match;
      }
    );
  }

  addFormLabels(content) {
    return content.replace(
      /<form([^>]*)>/g,
      (match, attrs) => {
        if (!attrs.includes('aria-label')) {
          const id = attrs.match(/id="([^"]*)"/)?.[1] || 'form';
          return `<form${attrs} aria-label="${id} form">`;
        }
        return match;
      }
    );
  }

  addImageLabels(content) {
    return content.replace(
      /<img([^>]*)>/g,
      (match, attrs) => {
        if (!attrs.includes('alt=') && !attrs.includes('aria-label')) {
          const src = attrs.match(/src="([^"]*)"/)?.[1] || '';
          const name = src.split('/').pop().split('.')[0].replace(/-/g, ' ');
          return `<img${attrs} alt="${name}" aria-label="${name}">`;
        }
        return match;
      }
    );
  }

  addNavigationLabels(content) {
    return content.replace(
      /<nav([^>]*)>/g,
      (match, attrs) => {
        if (!attrs.includes('aria-label')) {
          return `<nav${attrs} aria-label="Main navigation">`;
        }
        return match;
      }
    );
  }

  addInteractiveLabels(content) {
    // Add labels to links
    content = content.replace(
      /<a([^>]*)>/g,
      (match, attrs) => {
        if (!attrs.includes('aria-label')) {
          const text = match.match(/>([^<]*)</)?.[1]?.trim() || 'Link';
          return `<a${attrs} aria-label="${text}">`;
        }
        return match;
      }
    );

    // Add labels to inputs
    content = content.replace(
      /<input([^>]*)>/g,
      (match, attrs) => {
        if (!attrs.includes('aria-label')) {
          const type = attrs.match(/type="([^"]*)"/)?.[1] || 'input';
          const id = attrs.match(/id="([^"]*)"/)?.[1] || type;
          return `<input${attrs} aria-label="${id} ${type}">`;
        }
        return match;
      }
    );

    return content;
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

// Run the enhancer
const enhancer = new AccessibilityEnhancer();
enhancer.enhanceAccessibility(); 