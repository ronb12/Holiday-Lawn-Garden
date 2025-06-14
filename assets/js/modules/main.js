
// main.js
// Use window.firebase (from the script tag in HTML) instead.
// Add null checks before all addEventListener calls, e.g.:
// const el = document.getElementById('someId');
// if (el) { el.addEventListener('click', ...); }

// Import configuration and error handler
import { CONFIG } from './config.js';
import { ErrorHandler, handleError } from './error-handler.js';

// Main JavaScript for Holliday Lawn & Garden website
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Initialize UI components
    initializeUI();
    setupEventListeners();
    registerServiceWorker();
    initializeFirebase();

    // Mobile menu close button functionality
    const closeBtn = document.querySelector('.mobile-menu-close');
    const navLinks = document.querySelector('.nav-links');
    if (closeBtn && navLinks) {
      closeBtn.addEventListener('click', function() {
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// Initialize UI components
function initializeUI() {
  // Mobile menu functionality
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeButton = document.querySelector('.mobile-menu-close');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      mobileMenu?.classList.add('active');
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      mobileMenu?.classList.remove('active');
    });
  }

  // Mobile menu tabs
  const navLinks = document.querySelector('.nav-links');
  const tabHeaders = document.querySelectorAll('.nav-tab-header');

  if (navLinks && tabHeaders.length > 0) {
    // Initialize tabs
    tabHeaders.forEach(header => {
      const tab = header.parentElement;
      const content = tab.querySelector('.nav-tab-content');
      const icon = header.querySelector('.fa-chevron-down');

      // Set initial ARIA attributes
      header.setAttribute('role', 'tab');
      header.setAttribute('aria-selected', 'false');
      header.setAttribute('aria-expanded', 'false');
      content.setAttribute('role', 'tabpanel');
      content.setAttribute('aria-hidden', 'true');

      header.addEventListener('click', () => {
        const isActive = header.classList.contains('active');

        // Close all tabs
        tabHeaders.forEach(h => {
          const tabContent = h.parentElement.querySelector('.nav-tab-content');
          const tabIcon = h.querySelector('.fa-chevron-down');
          
          h.classList.remove('active');
          h.setAttribute('aria-selected', 'false');
          h.setAttribute('aria-expanded', 'false');
          tabContent.classList.remove('active');
          tabContent.setAttribute('aria-hidden', 'true');
          if (tabIcon) {
            tabIcon.style.transform = 'rotate(0deg)';
          }
        });

        // Open clicked tab if it wasn't active
        if (!isActive) {
          header.classList.add('active');
          header.setAttribute('aria-selected', 'true');
          header.setAttribute('aria-expanded', 'true');
          content.classList.add('active');
          content.setAttribute('aria-hidden', 'false');
          if (icon) {
            icon.style.transform = 'rotate(180deg)';
          }
        }
      });

      // Add keyboard support
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        // Close all tabs on desktop
        tabHeaders.forEach(header => {
          const content = header.parentElement.querySelector('.nav-tab-content');
          const icon = header.querySelector('.fa-chevron-down');
          
          header.classList.remove('active');
          header.setAttribute('aria-selected', 'false');
          header.setAttribute('aria-expanded', 'false');
          content.classList.remove('active');
          content.setAttribute('aria-hidden', 'true');
          if (icon) {
            icon.style.transform = 'rotate(0deg)';
          }
        });
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close all tabs
        tabHeaders.forEach(header => {
          const content = header.parentElement.querySelector('.nav-tab-content');
          const icon = header.querySelector('.fa-chevron-down');
          
          header.classList.remove('active');
          header.setAttribute('aria-selected', 'false');
          header.setAttribute('aria-expanded', 'false');
          content.classList.remove('active');
          content.setAttribute('aria-hidden', 'true');
          if (icon) {
            icon.style.transform = 'rotate(0deg)';
          }
        });
      }
    });

    // Handle outside clicks
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target)) {
        // Close all tabs
        tabHeaders.forEach(header => {
          const content = header.parentElement.querySelector('.nav-tab-content');
          const icon = header.querySelector('.fa-chevron-down');
          
          header.classList.remove('active');
          header.setAttribute('aria-selected', 'false');
          header.setAttribute('aria-expanded', 'false');
          content.classList.remove('active');
          content.setAttribute('aria-hidden', 'true');
          if (icon) {
            icon.style.transform = 'rotate(0deg)';
          }
        });
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });

  // Navigation
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', handleNavigation);
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Use relative path for GitHub Pages
    const swPath = './service-worker.js';
    navigator.serviceWorker
      .register(swPath)
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker Registration error:', error);
      });
  }
}

function initializeFirebase() {
  try {
    // Use global firebase object
    if (typeof firebase !== 'undefined') {
      const auth = firebase.auth();
      const db = firebase.firestore();
      
      // Log page view if analytics is available
      if (firebase.analytics) {
        firebase.analytics().logEvent('page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname
        });
      }
    }
  } catch (error) {
    console.error('Firebase Initialization error:', error);
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Handle form submission based on form type
    switch (form.id) {
      case 'contact-form':
        handleContactForm(data);
        break;
      case 'login-form':
        handleLoginForm(data);
        break;
      case 'payment-form':
        handlePaymentForm(data);
        break;
      default:
        console.warn('Unknown form type:', form.id);
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'Form Submission');
  }
}

function handleNavigation(event) {
  const link = event.currentTarget;
  const href = link.getAttribute('href');
  
  // Add loading state
  document.body.classList.add('loading');
  
  // Handle navigation
  if (href && href.startsWith('/')) {
    event.preventDefault();
    window.location.href = href;
  }
}

// Initialize tabs if they exist
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Initialize tabs if they exist
if (document.querySelector('.tabs')) {
  initTabs();
}

// Initialize any UI components
function initializeComponents() {
  // Initialize any third-party components
  if (typeof AOS !== 'undefined') {
    AOS.init();
  }
  
  // Initialize any custom components
  initializeCustomComponents();
}

function initializeCustomComponents() {
  // Add any custom component initialization here
}

// Export functions for use in other files
export {
  initializeUI,
  setupEventListeners,
  registerServiceWorker,
  initializeFirebase,
  handleFormSubmit,
  handleNavigation
};


export {
  initializeUI,
  setupEventListeners,
  registerServiceWorker,
  initializeFirebase,
  handleFormSubmit,
  handleNavigation,
  initTabs,
  initializeComponents,
  initializeCustomComponents
};
