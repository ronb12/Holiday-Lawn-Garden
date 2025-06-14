// Hero Section JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const heroImage = document.querySelector('.hero img');

  // Show loading state
  function showLoading() {
    loading.style.display = 'flex';
  }

  // Hide loading state
  function hideLoading() {
    loading.style.display = 'none';
  }

  // Show error message
  function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    setTimeout(() => {
      error.style.display = 'none';
    }, 5000);
  }

  // Handle image loading
  if (heroImage) {
    showLoading();
    heroImage.onload = () => {
      hideLoading();
    };
    heroImage.onerror = () => {
      hideLoading();
      showError('Failed to load hero image');
    };
  }

  // Handle errors
  window.onerror = (message, source, lineno, colno, error) => {
    showError('An error occurred. Please try again later.');
    console.error('Error:', error);
  };

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Parallax effect for hero image
  window.addEventListener('scroll', () => {
    if (heroImage) {
      const scrolled = window.pageYOffset;
      heroImage.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  });
});
