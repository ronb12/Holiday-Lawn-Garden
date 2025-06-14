
// ux_enhancer.js
const fs = require('fs');
const path = require('path');

class UXEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhanceUX() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Add loading spinner
        content = this.addLoadingSpinner(content);
        
        // Add notification system
        content = this.addNotificationSystem(content);
        
        // Add loading states to forms
        content = this.addFormLoadingStates(content);
        
        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  addLoadingSpinner(content) {
    const spinner = `
    <div id="loading-spinner" class="loading-spinner" style="display: none;">
      <div class="spinner"></div>
    </div>`;

    return content.replace(
      /<body>/,
      `<body>${spinner}`
    );
  }

  addNotificationSystem(content) {
    const notificationSystem = `
    <div id="notification-container" class="notification-container">
      <div id="notification" class="notification" style="display: none;">
        <span class="notification-message"></span>
        <button class="notification-close">&times;</button>
      </div>
    </div>`;

    return content.replace(
      /<body>/,
      `<body>${notificationSystem}`
    );
  }

  addFormLoadingStates(content) {
    return content.replace(
      /<form([^>]*)>/g,
      (match, attrs) => {
        // Add loading state class
        if (!attrs.includes('class=')) {
          return `<form${attrs} class="form-with-loading">`;
        }
        return match.replace(/class="([^"]*)"/, 'class="$1 form-with-loading"');
      }
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

// Run the enhancer
const enhancer = new UXEnhancer();
enhancer.enhanceUX(); 

export {
  UXEnhancer,
  class
        if
};
