// reCAPTCHA configuration
const recaptchaConfig = {
  siteKey: 'YOUR_RECAPTCHA_SITE_KEY',
  size: 'normal',
  theme: 'light',
  callback: function(response) {
    // Handle reCAPTCHA response
    console.log('reCAPTCHA verified');
  }
};

// Initialize reCAPTCHA
window.recaptchaConfig = recaptchaConfig;

// Add reCAPTCHA script
const script = document.createElement('script');
script.src = 'https://www.google.com/recaptcha/api.js';
script.async = true;
script.defer = true;
document.head.appendChild(script); 