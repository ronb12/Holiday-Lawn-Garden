const fs = require('fs');
const path = require('path');

class UXEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhance() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add toast notifications
        content = this.addToastNotifications(content);

        // Add breadcrumbs
        content = this.addBreadcrumbs(content, file);

        // Add progress indicators
        content = this.addProgressIndicators(content);

        // Add form feedback
        content = this.addFormFeedback(content);

        // Add scroll to top button
        content = this.addScrollToTop(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  addToastNotifications(content) {
    if (!content.includes('toast-container')) {
      const toastContainer = `
        <div id="toast-container" class="toast-container">
          <div id="toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
              <strong class="me-auto" id="toast-title">Notification</strong>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" id="toast-message"></div>
          </div>
        </div>
      `;
      return content.replace('</body>', `${toastContainer}\n</body>`);
    }
    return content;
  }

  addBreadcrumbs(content, file) {
    const fileName = path.basename(file, '.html');
    const breadcrumbs = this.generateBreadcrumbs(fileName);

    if (!content.includes('breadcrumb') && !content.includes('404.html')) {
      const breadcrumbHtml = `
        <nav aria-label="breadcrumb" class="breadcrumb-container">
          <ol class="breadcrumb">
            ${breadcrumbs
              .map(
                crumb => `
              <li class="breadcrumb-item ${crumb.active ? 'active' : ''}">
                ${crumb.active ? crumb.text : `<a href="${crumb.href}">${crumb.text}</a>`}
              </li>
            `
              )
              .join('')}
          </ol>
        </nav>
      `;
      return content.replace('<main', `${breadcrumbHtml}\n<main`);
    }
    return content;
  }

  addProgressIndicators(content) {
    if (content.includes('<form') && !content.includes('progress-indicator')) {
      const progressIndicator = `
        <div class="progress-indicator" style="display: none;">
          <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <p class="progress-text">Processing...</p>
        </div>
      `;
      return content.replace('</form>', `${progressIndicator}\n</form>`);
    }
    return content;
  }

  addFormFeedback(content) {
    if (content.includes('<form') && !content.includes('form-feedback')) {
      const formFeedback = `
        <div class="form-feedback" role="alert" aria-live="polite" style="display: none;">
          <div class="alert alert-success" role="alert">
            <i class="fas fa-check-circle"></i>
            <span class="feedback-message"></span>
          </div>
        </div>
      `;
      return content.replace('</form>', `${formFeedback}\n</form>`);
    }
    return content;
  }

  addScrollToTop(content) {
    if (!content.includes('scroll-to-top')) {
      const scrollToTop = `
        <button id="scroll-to-top" class="scroll-to-top" aria-label="Scroll to top">
          <i class="fas fa-arrow-up"></i>
        </button>
      `;
      return content.replace('</body>', `${scrollToTop}\n</body>`);
    }
    return content;
  }

  generateBreadcrumbs(fileName) {
    const breadcrumbs = [{ text: 'Home', href: 'index.html', active: fileName === 'index' }];

    const pageMap = {
      about: 'About Us',
      services: 'Services',
      contact: 'Contact',
      gallery: 'Gallery',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      login: 'Login',
      register: 'Register',
      profile: 'My Profile',
      dashboard: 'Dashboard',
      admin: 'Admin',
      pay: 'Pay Bill',
      receipt: 'Receipt',
      education: 'Education',
      sitemap: 'Sitemap',
    };

    if (pageMap[fileName]) {
      breadcrumbs.push({
        text: pageMap[fileName],
        href: `${fileName}.html`,
        active: true,
      });
    }

    return breadcrumbs;
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
enhancer.enhance();
