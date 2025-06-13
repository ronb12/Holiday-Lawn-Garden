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

// Service Worker Registration
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) {
        console.log('Service Worker already registered:', existingRegistration);
        return existingRegistration;
      }

      // Register new service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });

      // Handle successful activation
      registration.addEventListener('activate', event => {
        console.log('Service Worker activated');
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Main JavaScript for Holliday Lawn & Garden website
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Initialize UI components
    initializeUI();
    setupEventListeners();
    registerServiceWorker();
    initializeFirebase();

    // Handle service worker updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

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
  try {
    // Set active navigation link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath.split('/').pop()) {
        link.classList.add('active');
      }
    });

    // Mobile menu
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
        }
      });

      // Close mobile menu when clicking a link
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
        });
      });
    }

    // Header scroll effect
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    if (header) {
      window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
          header.classList.remove('scroll-up');
          return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
          // Scrolling down
          header.classList.remove('scroll-up');
          header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
          // Scrolling up
          header.classList.remove('scroll-down');
          header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
      });
    }

    // Smooth scroll for anchor links
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

    // Hide loading spinner
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  } catch (error) {
    console.error('Error initializing UI:', error);
  }
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

// Export functions
export {
  initializeUI,
  setupEventListeners,
  initializeFirebase,
  handleFormSubmit,
  handleNavigation,
  initTabs,
  initializeComponents,
  initializeCustomComponents
};

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
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

// Update Notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <p>A new version is available!</p>
    <button onclick="window.location.reload()">Update Now</button>
  `;
  document.body.appendChild(notification);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  initializeUI();
});
