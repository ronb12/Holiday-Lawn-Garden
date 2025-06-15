class LoadingHandler {
  constructor() {
    this.overlay = document.getElementById('loading-overlay');
    this.message = document.getElementById('loading-message');
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Handle form submissions
    document.querySelectorAll('.form-with-loading').forEach(form => {
      form.addEventListener('submit', e => {
        this.showLoading('Processing form...');
        form.classList.add('loading');
      });
    });

    // Handle button clicks
    document.querySelectorAll('.button-with-loading').forEach(button => {
      button.addEventListener('click', e => {
        if (!button.closest('form')) {
          this.showLoading('Processing...');
          button.classList.add('loading');
        }
      });
    });

    // Handle link clicks
    document.querySelectorAll('.link-with-loading').forEach(link => {
      link.addEventListener('click', e => {
        this.showLoading('Loading page...');
        link.classList.add('loading');
      });
    });

    // Handle page load
    window.addEventListener('load', () => {
      this.hideLoading();
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.showLoading('Saving changes...');
    });
  }

  showLoading(message = 'Loading...') {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      if (this.message) {
        this.message.textContent = message;
      }
    }
  }

  hideLoading() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    document.querySelectorAll('.loading').forEach(element => {
      element.classList.remove('loading');
    });
  }

  setLoadingMessage(message) {
    if (this.message) {
      this.message.textContent = message;
    }
  }
}

// Initialize loading handler
document.addEventListener('DOMContentLoaded', () => {
  window.loadingHandler = new LoadingHandler();
});
