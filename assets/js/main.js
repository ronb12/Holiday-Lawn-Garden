// Use window.firebase (from the script tag in HTML) instead.
// Add null checks before all addEventListener calls, e.g.:
// const el = document.getElementById('someId');
// if (el) { el.addEventListener('click', ...); }

// Import configuration and error handler
import { CONFIG } from './config.js';
import { ErrorHandler, handleError } from './error-handler.js';

// Service Worker Registration
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Clear all existing caches first
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('Cleared old caches');

        // Unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('Unregistered old service workers');

        // Register new service worker
        const registration = await navigator.serviceWorker.register(
          '/Holliday-Lawn-Garden/service-worker.js',
          {
            scope: '/Holliday-Lawn-Garden/',
          }
        );
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed');
            }
          });
        });
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    });
  }
}

// Main JavaScript for Holliday Lawn & Garden website
document.addEventListener('DOMContentLoaded', function () {
  try {
    // Initialize UI components
    initializeUI();
    setupEventListeners();

    // Register service worker only once
    if (!window.serviceWorkerRegistered) {
      registerServiceWorker().then(() => {
        window.serviceWorkerRegistered = true;
      });
    }

    // Handle service worker updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // Robust Hamburger Menu Toggle
    (function () {
      const hamburger = document.querySelector('.hamburger');
      const nav = document.querySelector('.main-header nav');
      const navLinks = document.querySelectorAll('.nav-links a');
      const body = document.body;

      if (!hamburger || !nav) return;

      // Toggle menu
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        if (nav.classList.contains('active')) {
          body.style.overflow = 'hidden';
        } else {
          body.style.overflow = '';
        }
      });

      // Close menu when clicking a nav link
      navLinks.forEach(link => {
        link.addEventListener('click', function () {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
          body.style.overflow = '';
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', function (e) {
        if (
          nav.classList.contains('active') &&
          !nav.contains(e.target) &&
          !hamburger.contains(e.target)
        ) {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
          body.style.overflow = '';
        }
      });

      // Close menu on resize
      window.addEventListener('resize', function () {
        if (window.innerWidth > 900 && nav.classList.contains('active')) {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
          body.style.overflow = '';
        }
      });
    })();

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
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });

    // Update copyright year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
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
  } catch (error) {
    console.error('UI initialization error:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Add any additional event listeners here
}
