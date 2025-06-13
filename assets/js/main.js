// Use window.firebase (from the script tag in HTML) instead.
// Add null checks before all addEventListener calls, e.g.:
// const el = document.getElementById('someId');
// if (el) { el.addEventListener('click', ...); }

// Import configuration and error handler
import { CONFIG } from './config.js';
import { ErrorHandler, handleError } from './error-handler.js';

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

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

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });

  // Update copyright year
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});

// Check for updates
async function checkForUpdates() {
  try {
    const response = await fetch('version.json');
    if (!response.ok) throw new Error('Failed to fetch version');
    const data = await response.json();
    const currentVersion = '1.0.4'; // Update this when you make changes
    
    if (data.version !== currentVersion) {
      showUpdateBanner();
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Show update banner
function showUpdateBanner() {
  const updateBanner = document.getElementById('updateBanner');
  if (updateBanner) {
    updateBanner.style.display = 'block';
    updateBanner.addEventListener('click', clearCacheAndReload);
  }
}

// Clear cache and reload
async function clearCacheAndReload() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  window.location.reload(true);
}

// Check for updates every 5 minutes
setInterval(checkForUpdates, 300000);

// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
  // Navigation scroll effect
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    });
  }

  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });
  }

  // Smooth scroll for all internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Basic validation
      let isValid = true;
      for (const [key, value] of Object.entries(data)) {
        if (!value.trim()) {
          isValid = false;
          const input = form.querySelector(`[name="${key}"]`);
          if (input) {
            input.classList.add('error');
          }
        }
      }

      if (isValid) {
        // Here you would typically send the form data to your server
        console.log('Form data:', data);
        form.reset();
        showMessage('Thank you for your message! We will get back to you soon.', 'success');
      } else {
        showMessage('Please fill in all required fields.', 'error');
      }
    });
  });

  // Message display function
  function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  // Image lazy loading
  const images = document.querySelectorAll('img[loading="lazy"]');
  if ('loading' in HTMLImageElement.prototype) {
    images.forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for browsers that don't support lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
});
