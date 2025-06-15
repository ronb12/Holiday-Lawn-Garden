// Security Headers Configuration
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s+/g, ' ')
    .trim(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Apply security headers
Object.entries(securityHeaders).forEach(([key, value]) => {
  document.head.appendChild(
    Object.assign(document.createElement('meta'), {
      httpEquiv: key,
      content: value,
    })
  );
});
