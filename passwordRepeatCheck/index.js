class CustomInput extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'placeholder', 'class', 'id', 'required', 'autocomplete', 'autofocus', 'minlength', 'pattern', 'compare', 'name', 'errorText'];
  }

  constructor() {
    super();

    // Attach shadow DOM
    this.attachShadow({ mode: 'open' });

    // Create and apply stylesheet
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(`
      label.index--form {
        display: flex;
        flex-direction: column;
        font-size: 1.2em;
      }
      input.index__form {
        padding: var(--default-padding-inset);
        border-radius: var(--default-border-radius);
        border: unset;
        color: var(--primary);
      }
      input.index__form:focus {
        border-bottom: var(--primary-light) 2px groove;
        outline: none; /* Remove default focus outline */
      }
      .error {
        font-size: 0.9em;
        color: deeppink;
        display: none;
      }
    `);

    // Create template
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.innerHTML = `
      <label class="">
        <small class="error"></small>
        <span></span>
        <input />
      </label>
    `;

    // Store references to elements
    this.labelElement = this.shadowRoot.querySelector('label');
    this.inputElement = this.shadowRoot.querySelector('input');
    this.labelTextElement = this.shadowRoot.querySelector('span');
    this.errorElement = this.shadowRoot.querySelector('.error');
  }

  connectedCallback() {
    this.applyAttributes();

    if (this.textContent) {
      this.labelTextElement.textContent = this.textContent.trim();
    }

    // Add event listener to compare passwords if 'compare' attribute is present
    if (this.hasAttribute('compare')) {
      this.inputElement.addEventListener('input', this.comparePasswords.bind(this));
    }

    // Add event listener for form submission
    this.inputElement.closest('form').addEventListener('submit', (event) => {
      this.comparePasswords(); // Ensure custom validation is checked before submission
      if (!this.inputElement.checkValidity()) {
        this.inputElement.reportValidity();
        event.preventDefault(); // Prevent form submission
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.applyAttributes();
  }

  applyAttributes() {
    const attributes = CustomInput.observedAttributes;
    attributes.forEach(attr => {
      if (attr === 'compare') return; // skip 'compare' as it's not an input attribute
      if (this.hasAttribute(attr)) {
        if (attr === 'class') {
          // Apply the class to both label and input elements
          this.labelElement.className = this.getAttribute(attr);
          this.inputElement.className = this.getAttribute(attr);
        } else if (attr === 'errorText') {
          // Set the error message text
          this.errorElement.textContent = this.getAttribute(attr);
        } else {
          this.inputElement.setAttribute(attr, this.getAttribute(attr));
        }
      } else {
        this.inputElement.removeAttribute(attr);
      }
    });
  }

  comparePasswords() {
    const compareId = this.getAttribute('compare');
    const firstPasswordInput = document.querySelector(`#${compareId}`);
    const errorMessage = this.getAttribute('errorText') || 'Passwords do not match.';

    if (firstPasswordInput && firstPasswordInput.value !== this.inputElement.value) {
      this.errorElement.style.display = 'block';
      this.inputElement.setCustomValidity(errorMessage);
    } else {
      this.errorElement.style.display = 'none';
      this.inputElement.setCustomValidity(''); // Reset custom validity
    }
  }
}

customElements.define('password-repeat-check', CustomInput);
