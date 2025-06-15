// error_handling.js
// Error handling and notifications
class ErrorHandler {
  constructor() {
    this.notificationContainer = this.createNotificationContainer();
    this.setupGlobalErrorHandling();
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  setupGlobalErrorHandling() {
    window.addEventListener('error', event => {
      this.handleError(event.error || new Error(event.message));
    });

    window.addEventListener('unhandledrejection', event => {
      this.handleError(event.reason);
    });
  }

  handleError(error) {
    console.error('Error:', error);
    this.showNotification(error.message || 'An unexpected error occurred', 'error');
  }

  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} slide-in`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="notification-icon ${this.getIconClass(type)}"></i>
        <span class="notification-message">${message}</span>
      </div>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;

    this.notificationContainer.appendChild(notification);

    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      this.closeNotification(notification);
    });

    // Auto-close after duration
    if (duration > 0) {
      setTimeout(() => {
        this.closeNotification(notification);
      }, duration);
    }

    return notification;
  }

  closeNotification(notification) {
    notification.classList.add('fade-out');
    notification.addEventListener('animationend', () => {
      notification.remove();
    });
  }

  getIconClass(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
    };
    return icons[type] || icons.info;
  }

  // Convenience methods
  success(message, duration) {
    return this.showNotification(message, 'success', duration);
  }

  error(message, duration) {
    return this.showNotification(message, 'error', duration);
  }

  warning(message, duration) {
    return this.showNotification(message, 'warning', duration);
  }

  info(message, duration) {
    return this.showNotification(message, 'info', duration);
  }
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
  }

  .notification {
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideIn 0.3s ease-out;
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .notification-icon {
    font-size: 1.25rem;
  }

  .notification-success {
    border-left: 4px solid #4CAF50;
  }

  .notification-success .notification-icon {
    color: #4CAF50;
  }

  .notification-error {
    border-left: 4px solid #dc3545;
  }

  .notification-error .notification-icon {
    color: #dc3545;
  }

  .notification-warning {
    border-left: 4px solid #ffc107;
  }

  .notification-warning .notification-icon {
    color: #ffc107;
  }

  .notification-info {
    border-left: 4px solid #17a2b8;
  }

  .notification-info .notification-icon {
    color: #17a2b8;
  }

  .notification-close {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0;
    margin-left: 12px;
  }

  .notification-close:hover {
    color: #343a40;
  }

  .fade-out {
    animation: fadeOut 0.3s ease-in forwards;
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @media (max-width: 768px) {
    .notification-container {
      left: 20px;
      right: 20px;
      max-width: none;
    }
  }
`;
document.head.appendChild(style);

// Initialize error handler
const errorHandler = new ErrorHandler();

export { ErrorHandler };
