/*
  *
  <password-repeat-check compare="password1">
    <small slot="error" class="error">Las contraseñas no coinciden</small>
    <label slot="children">
      Confirma tu contraseña:
      <input type="password" placeholder="Repite tu contraseña" autocomplete="new-password" minlength="6"
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}" />
    </label>
  </password-repeat-check>
  *
  */

class CustomInput extends HTMLElement {
  static get observedAttributes() {
    return [
      'compare'
    ];
  }

  constructor() {
    super();

    // Initialize storedAttributes
    this.storedAttributes = {};

    // Create template with a slot
    const template = document.createElement('template');
    template.innerHTML = `
        <slot class="error" name="error" ></slot>
        <slot name="children"> </slot>
    `;

    // Attach the template's content to the custom element
    const templateContent = template.content.cloneNode(true);
    this.appendChild(templateContent); // No shadow DOM

    // Store references to elements
    this.inputElement = this.querySelector('input');
    this.errorElement = this.querySelector('.error');
  }

  connectedCallback() {
    this.storeAttributes();
    this.applyAttributes();

    // Add event listener to compare passwords if 'compare' attribute is present
    if (this.storedAttributes.compare) {
      this.inputElement.addEventListener('input', this.comparePasswords.bind(this));
    }

    // Dynamically access form and add event listener for form submission
    const formElement = this.closest('form');
    if (formElement) {
      formElement.addEventListener('submit', (event) => {
        this.comparePasswords(); // Ensure custom validation is checked before submission
        if (!this.inputElement.checkValidity()) {
          this.inputElement.reportValidity();
          event.preventDefault(); // Prevent form submission
        }
      });
    }
  }

  storeAttributes() {
    // Store all observed attributes and their values in the storedAttributes object
    CustomInput.observedAttributes.forEach(attr => {
      if (this.hasAttribute(attr)) {
        this.storedAttributes[attr] = this.getAttribute(attr);
      } else {
        delete this.storedAttributes[attr]; // Remove from storedAttributes if not present
      }
    });
  }

  applyAttributes() {
    Object.keys(this.storedAttributes).forEach(attr => {
      if (attr === 'compare') return; // Skip 'compare' as it's not an input attribute
      this.inputElement.setAttribute(attr, this.storedAttributes[attr]);
    });

    // Apply the passed class to the label and input elements
    if (this.hasAttribute('class')) {
      const classes = this.getAttribute('class').split(' ');
      classes.forEach(cls => {
        this.querySelector('label').classList.add(cls);
        this.inputElement.classList.add(cls);
      });
    }
  }

  comparePasswords() {
    const compareId = this.storedAttributes.compare;
    const firstPasswordInput = document.querySelector(`#${compareId}`);
    const errorMessage = this.storedAttributes.errorText || 'Passwords do not match.';

    if (firstPasswordInput && firstPasswordInput.value !== this.inputElement.value) {
      this.errorElement.style.display = 'block'; // Show error message
      this.inputElement.setCustomValidity(errorMessage);
    } else {
      this.errorElement.style.display = 'none'; // Hide error message
      this.inputElement.setCustomValidity(''); // Reset custom validity
    }
  }
}

customElements.define('password-repeat-check', CustomInput);
