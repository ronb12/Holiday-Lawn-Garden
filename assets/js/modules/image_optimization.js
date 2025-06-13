
// image_optimization.js
// Image optimization and lazy loading
class ImageOptimizer {
  constructor() {
    this.images = document.querySelectorAll('img[data-src]');
    this.imageObserver = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );

      this.images.forEach(image => {
        this.imageObserver.observe(image);
      });
    } else {
      this.loadAllImages();
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.imageObserver.unobserve(entry.target);
      }
    });
  }

  loadImage(image) {
    const src = image.getAttribute('data-src');
    if (!src) return;

    // Create a new image to preload
    const tempImage = new Image();
    
    tempImage.onload = () => {
      image.src = src;
      image.classList.add('loaded');
      image.removeAttribute('data-src');
    };

    tempImage.onerror = () => {
      image.classList.add('error');
      console.error(`Failed to load image: ${src}`);
    };

    tempImage.src = src;
  }

  loadAllImages() {
    this.images.forEach(image => this.loadImage(image));
  }
}

// Initialize image optimization
document.addEventListener('DOMContentLoaded', () => {
  new ImageOptimizer();
});

// Add loading animation styles
const style = document.createElement('style');
style.textContent = `
  img[data-src] {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  img.loaded {
    opacity: 1;
  }

  img.error {
    border: 2px solid #dc3545;
  }

  .image-container {
    position: relative;
    overflow: hidden;
    background-color: #f8f9fa;
  }

  .image-container::before {
    content: '';
    display: block;
    padding-top: 56.25%; /* 16:9 Aspect Ratio */
  }

  .image-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
document.head.appendChild(style); 

export {
  ImageOptimizer
};
