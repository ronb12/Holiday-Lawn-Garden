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

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('Service Worker update found!');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  showUpdateNotification();
                }
              });
            });
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }

    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
      hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', function(event) {
        const isClickInside = hamburger.contains(event.target) || nav.contains(event.target);
        
        if (!isClickInside && nav.classList.contains('active')) {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
        }
      });

      // Close menu when clicking a link
      const navItems = nav.querySelectorAll('a');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
        });
      });
    }

    // Header scroll effect
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
      }
      
      if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
      } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
      }
      lastScroll = currentScroll;
    });

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

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <p>A new version is available!</p>
    <button onclick="window.location.reload()">Update Now</button>
  `;
  document.body.appendChild(notification);
  
  // Add styles for the notification
  const style = document.createElement('style');
  style.textContent = `
    .update-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 1rem;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .update-notification button {
      background: white;
      color: #4CAF50;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 3px;
      cursor: pointer;
      font-weight: 600;
    }
    .update-notification button:hover {
      background: #f0f0f0;
    }
  `;
  document.head.appendChild(style);
}
