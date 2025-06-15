const fs = require('fs');
const path = require('path');

class LoadingStateEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhance() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add loading states to forms
        content = this.addFormLoadingStates(content);

        // Add loading states to buttons
        content = this.addButtonLoadingStates(content);

        // Add loading states to links
        content = this.addLinkLoadingStates(content);

        // Add loading overlay
        content = this.addLoadingOverlay(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  addFormLoadingStates(content) {
    // Add loading state to forms
    content = content.replace(/<form([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('class=')) {
        return `<form${attrs} class="form-with-loading">`;
      }
      return match.replace(/class="([^"]*)"/, 'class="$1 form-with-loading"');
    });

    // Add loading state to submit buttons
    content = content.replace(/<button([^>]*)type="submit"([^>]*)>/g, (match, before, after) => {
      if (!match.includes('class=')) {
        return `<button${before}type="submit"${after} class="button-with-loading">`;
      }
      return match.replace(/class="([^"]*)"/, 'class="$1 button-with-loading"');
    });

    return content;
  }

  addButtonLoadingStates(content) {
    // Add loading state to buttons
    content = content.replace(/<button([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('class=')) {
        return `<button${attrs} class="button-with-loading">`;
      }
      return match.replace(/class="([^"]*)"/, 'class="$1 button-with-loading"');
    });

    return content;
  }

  addLinkLoadingStates(content) {
    // Add loading state to links
    content = content.replace(/<a([^>]*)href="([^"]*)"([^>]*)>/g, (match, before, href, after) => {
      if (!href.startsWith('#') && !href.startsWith('javascript:')) {
        if (!match.includes('class=')) {
          return `<a${before}href="${href}"${after} class="link-with-loading">`;
        }
        return match.replace(/class="([^"]*)"/, 'class="$1 link-with-loading"');
      }
      return match;
    });

    return content;
  }

  addLoadingOverlay(content) {
    const loadingOverlay = `
    <div id="loading-overlay" class="loading-overlay" style="display: none">
      <div class="spinner"></div>
      <p id="loading-message">Loading...</p>
    </div>`;

    // Add loading overlay if it doesn't exist
    if (!content.includes('loading-overlay')) {
      content = content.replace(/<body([^>]*)>/, `<body$1>${loadingOverlay}`);
    }

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
const enhancer = new LoadingStateEnhancer();
enhancer.enhance();
