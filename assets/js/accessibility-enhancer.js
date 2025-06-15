const fs = require('fs');
const path = require('path');

class AccessibilityEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhance() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Enhance form elements
        content = this.enhanceFormElements(content);

        // Enhance interactive elements
        content = this.enhanceInteractiveElements(content);

        // Enhance images
        content = this.enhanceImages(content);

        // Enhance navigation
        content = this.enhanceNavigation(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  enhanceFormElements(content) {
    // Add labels to form elements
    content = content.replace(/<input([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
        const type = attrs.match(/type="([^"]*)"/)?.[1] || 'text';
        const placeholder = attrs.match(/placeholder="([^"]*)"/)?.[1] || '';
        const id = attrs.match(/id="([^"]*)"/)?.[1] || '';

        if (!id) {
          const newId = `input-${Math.random().toString(36).substr(2, 9)}`;
          return `<input${attrs} id="${newId}" aria-label="${placeholder || type}">`;
        }

        return `<input${attrs} aria-label="${placeholder || type}">`;
      }
      return match;
    });

    // Add labels to textareas
    content = content.replace(/<textarea([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
        const placeholder = attrs.match(/placeholder="([^"]*)"/)?.[1] || 'Text area';
        const id = attrs.match(/id="([^"]*)"/)?.[1] || '';

        if (!id) {
          const newId = `textarea-${Math.random().toString(36).substr(2, 9)}`;
          return `<textarea${attrs} id="${newId}" aria-label="${placeholder}">`;
        }

        return `<textarea${attrs} aria-label="${placeholder}">`;
      }
      return match;
    });

    return content;
  }

  enhanceInteractiveElements(content) {
    // Add ARIA labels to buttons
    content = content.replace(/<button([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
        const text = match.match(/<button[^>]*>(.*?)<\/button>/)?.[1] || 'Button';
        return `<button${attrs} aria-label="${text.trim()}">`;
      }
      return match;
    });

    // Add ARIA labels to links
    content = content.replace(/<a([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
        const text = match.match(/<a[^>]*>(.*?)<\/a>/)?.[1] || 'Link';
        return `<a${attrs} aria-label="${text.trim()}">`;
      }
      return match;
    });

    return content;
  }

  enhanceImages(content) {
    // Add alt text to images
    content = content.replace(/<img([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('alt=')) {
        const src = attrs.match(/src="([^"]*)"/)?.[1] || '';
        const alt = path
          .basename(src, path.extname(src))
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        return `<img${attrs} alt="${alt}">`;
      }
      return match;
    });

    return content;
  }

  enhanceNavigation(content) {
    // Add ARIA labels to navigation
    content = content.replace(/<nav([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('aria-label')) {
        return `<nav${attrs} aria-label="Main navigation">`;
      }
      return match;
    });

    // Add ARIA current to active links
    content = content.replace(
      /<a([^>]*)class="([^"]*active[^"]*)"([^>]*)>/g,
      (match, before, classes, after) => {
        return `<a${before}class="${classes}"${after} aria-current="page">`;
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
enhancer.enhance();
