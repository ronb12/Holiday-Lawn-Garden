// Error Handler Class
class ErrorHandler {
    constructor() {
        this.errorContainer = document.getElementById('error-container') || this.createErrorContainer();
    }

    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'error-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    showError(message, duration = 5000) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'admin-alert admin-alert-error';
        errorDiv.textContent = message;
        this.errorContainer.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, duration);
    }

    showSuccess(message, duration = 5000) {
        const successDiv = document.createElement('div');
        successDiv.className = 'admin-alert admin-alert-success';
        successDiv.textContent = message;
        this.errorContainer.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, duration);
    }

    handleFirebaseError(error) {
        console.error('Firebase Error:', error);
        let message = 'An error occurred. Please try again.';
        
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'User not found. Please check your credentials.';
                    break;
                case 'auth/wrong-password':
                    message = 'Invalid password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address.';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Email is already in use.';
                    break;
                default:
                    message = error.message || message;
            }
        }
        
        this.showError(message);
    }
}

// Initialize global error handler
window.errorHandler = new ErrorHandler(); 