class FormValidator {
  constructor(e) {
    (this.form = e), (this.errors = new Map()), this.setupValidation();
  }
  setupValidation() {
    this.form.addEventListener('submit', e => this.handleSubmit(e)),
      this.form.querySelectorAll('input, textarea, select').forEach(e => {
        e.addEventListener('blur', () => this.validateField(e)),
          e.addEventListener('input', () => this.validateField(e));
      });
  }
  validateField(e) {
    const t = e.value.trim();
    let r = !0,
      s = '';
    if (
      (e.hasAttribute('required') && !t && ((r = !1), (s = 'This field is required')),
      'email' === e.type && t)
    ) {
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ||
        ((r = !1), (s = 'Please enter a valid email address'));
    }
    if ('tel' === e.type && t) {
      /^\+?[\d\s-]{10,}$/.test(t) || ((r = !1), (s = 'Please enter a valid phone number'));
    }
    return this.updateFieldState(e, r, s), r;
  }
  updateFieldState(e, t, r) {
    const s = e.parentElement.querySelector('.error-message');
    if (t) e.classList.remove('error'), s && s.remove(), this.errors.delete(e.name);
    else {
      if ((e.classList.add('error'), s)) s.textContent = r;
      else {
        const t = document.createElement('div');
        (t.className = 'error-message'), (t.textContent = r), e.parentElement.appendChild(t);
      }
      this.errors.set(e.name, r);
    }
  }
  async handleSubmit(e) {
    e.preventDefault();
    const t = this.form.querySelectorAll('input, textarea, select');
    let r = !0;
    if (
      (t.forEach(e => {
        this.validateField(e) || (r = !1);
      }),
      r)
    )
      try {
        this.setLoadingState(!0);
        const e = new FormData(this.form),
          t = await fetch(this.form.action, {
            method: this.form.method,
            body: e,
            headers: { Accept: 'application/json' },
          });
        if (!t.ok) throw new Error('Network response was not ok');
        await t.json();
        this.showSuccessMessage('Thank you for your submission!'), this.form.reset();
      } catch (e) {
        this.showFormError('An error occurred. Please try again later.');
      } finally {
        this.setLoadingState(!1);
      }
    else this.showFormError('Please correct the errors before submitting');
  }
  setLoadingState(e) {
    const t = this.form.querySelector('button[type="submit"]');
    t &&
      ((t.disabled = e),
      (t.innerHTML = e
        ? '<span class="spinner"></span> Submitting...'
        : t.dataset.originalText || 'Submit'));
  }
  showFormError(e) {
    const t = this.form.querySelector('.form-error') || document.createElement('div');
    (t.className = 'form-error'),
      (t.textContent = e),
      this.form.querySelector('.form-error') || this.form.insertBefore(t, this.form.firstChild);
  }
  showSuccessMessage(e) {
    const t = document.createElement('div');
    (t.className = 'form-success'),
      (t.textContent = e),
      this.form.insertBefore(t, this.form.firstChild),
      setTimeout(() => {
        t.remove();
      }, 5e3);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach(e => {
    new FormValidator(e);
  });
});
