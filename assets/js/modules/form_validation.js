
// form_validation.js
// Form validation and error handling
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
    this.setupValidation();
  }

  setupValidation() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.validateField(field));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (field.type === 'tel' && value) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
    }

    // Update field state
    this.updateFieldState(field, isValid, errorMessage);
    return isValid;
  }

  updateFieldState(field, isValid, errorMessage) {
    const errorElement = field.parentElement.querySelector('.error-message');
    
    if (!isValid) {
      field.classList.add('error');
      if (!errorElement) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = errorMessage;
        field.parentElement.appendChild(error);
      } else {
        errorElement.textContent = errorMessage;
      }
      this.errors.set(field.name, errorMessage);
    } else {
      field.classList.remove('error');
      if (errorElement) {
        errorElement.remove();
      }
      this.errors.delete(field.name);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const fields = this.form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showFormError('Please correct the errors before submitting');
      return;
    }

    try {
      // Show loading state
      this.setLoadingState(true);
      
      // Submit form data
      const formData = new FormData(this.form);
      const response = await fetch(this.form.action, {
        method: this.form.method,
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      // Show success message
      this.showSuccessMessage('Thank you for your submission!');
      this.form.reset();
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showFormError('An error occurred. Please try again later.');
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(isLoading) {
    const submitButton = this.form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.innerHTML = isLoading ? 
        '<span class="spinner"></span> Submitting...' : 
        submitButton.dataset.originalText || 'Submit';
    }
  }

  showFormError(message) {
    const errorContainer = this.form.querySelector('.form-error') || 
      document.createElement('div');
    errorContainer.className = 'form-error';
    errorContainer.textContent = message;
    
    if (!this.form.querySelector('.form-error')) {
      this.form.insertBefore(errorContainer, this.form.firstChild);
    }
  }

  showSuccessMessage(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'form-success';
    successContainer.textContent = message;
    
    this.form.insertBefore(successContainer, this.form.firstChild);
    
    // Remove success message after 5 seconds
    setTimeout(() => {
      successContainer.remove();
    }, 5000);
  }
}

// Initialize form validation for all forms
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach(form => {
    new FormValidator(form);
  });
}); 

export {
  FormValidator
};
