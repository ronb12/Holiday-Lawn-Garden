class ImageOptimizer {
  constructor() {
    (this.images = document.querySelectorAll('img[data-src]')),
      (this.imageObserver = null),
      this.init();
  }
  init() {
    'IntersectionObserver' in window
      ? ((this.imageObserver = new IntersectionObserver(e => this.handleIntersection(e), {
          rootMargin: '50px 0px',
          threshold: 0.01,
        })),
        this.images.forEach(e => {
          this.imageObserver.observe(e);
        }))
      : this.loadAllImages();
  }
  handleIntersection(e) {
    e.forEach(e => {
      e.isIntersecting && (this.loadImage(e.target), this.imageObserver.unobserve(e.target));
    });
  }
  loadImage(e) {
    const t = e.getAttribute('data-src');
    if (!t) return;
    const n = new Image();
    (n.onload = () => {
      (e.src = t), e.classList.add('loaded'), e.removeAttribute('data-src');
    }),
      (n.onerror = () => {
        e.classList.add('error');
      }),
      (n.src = t);
  }
  loadAllImages() {
    this.images.forEach(e => this.loadImage(e));
  }
}
document.addEventListener('DOMContentLoaded', () => {
  new ImageOptimizer();
});
const style = document.createElement('style');
(style.textContent =
  "\n  img[data-src] {\n    opacity: 0;\n    transition: opacity 0.3s ease-in-out;\n  }\n\n  img.loaded {\n    opacity: 1;\n  }\n\n  img.error {\n    border: 2px solid #dc3545;\n  }\n\n  .image-container {\n    position: relative;\n    overflow: hidden;\n    background-color: #f8f9fa;\n  }\n\n  .image-container::before {\n    content: '';\n    display: block;\n    padding-top: 56.25%; /* 16:9 Aspect Ratio */\n  }\n\n  .image-container img {\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    object-fit: cover;\n  }\n"),
  document.head.appendChild(style);
export { ImageOptimizer };
