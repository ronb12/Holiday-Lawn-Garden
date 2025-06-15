// Tab functionality
document.addEventListener('DOMContentLoaded', function () {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      // Add active class to clicked button
      button.classList.add('active');

      // Show corresponding tab pane
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
});

// Clear cache and reload
function clearCacheAndReload() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.active.postMessage('CLEAR_CACHE');
    });
  }
  // Force reload from server
  window.location.reload(true);
}

// Handle PWA installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log('✅ PWA install prompt ready');

  // Create and show the install button
  const installBtn = document.createElement('button');
  installBtn.id = 'installBtn';
  installBtn.className = 'floating-button install-button';
  installBtn.innerHTML = '<i class="fas fa-download"></i>';
  installBtn.title = 'Install App';
  installBtn.style.display = 'none';

  // Add the button to the floating buttons container
  const floatingButtons = document.querySelector('.floating-buttons');
  if (floatingButtons) {
    floatingButtons.appendChild(installBtn);
    installBtn.style.display = 'block';

    // Handle install button click
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome === 'accepted' ? '✅ Installed' : '❌ Dismissed'} the app`);

      // Hide the button
      installBtn.style.display = 'none';

      // Clear the deferredPrompt
      deferredPrompt = null;
    });
  }
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/Holliday-Lawn-Garden/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update banner
              const updateBanner = document.getElementById('updateBanner');
              if (updateBanner) {
                updateBanner.style.display = 'block';
                updateBanner.addEventListener('click', () => {
                  clearCacheAndReload();
                });
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Initialize Firebase
function initializeFirebaseDB() {
  return new Promise((resolve, reject) => {
    try {
      if (window.firebaseConfig) {
        // Firebase is already initialized
        resolve();
      } else {
        reject(new Error('Firebase configuration not found'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      try {
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        // Add timestamp
        data.timestamp = new Date().toISOString();

        // Save to Firestore
        await window.db.collection('contact-submissions').add(data);

        // Show success message
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Sorry, there was an error submitting your message. Please try again.');
      }
    });
  }
});
