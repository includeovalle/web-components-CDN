class ValidationComponent extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'checkid', 'pattern'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(`
      .message {
        margin: 0;
        color: mintcream;
      }
      .hidden {
        display: none;
      }
      .display {
        display: block;
      }
    `);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];
  }

  connectedCallback() {
    this.inputElement = document.getElementById(this.checkId);
    if (this.inputElement) {
      this.inputElement.addEventListener('input', this.handleInput.bind(this));
      this.render(); // Render immediately when connected
    }
  }

  disconnectedCallback() {
    if (this.inputElement) {
      this.inputElement.removeEventListener('input', this.handleInput.bind(this));
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && name === 'checkid') {
      if (this.inputElement) {
        this.inputElement.removeEventListener('input', this.handleInput.bind(this));
      }
      this.inputElement = document.getElementById(this.checkId);
      if (this.inputElement) {
        this.inputElement.addEventListener('input', this.handleInput.bind(this));
      }
    }
    this.render();
  }

  get type() {
    return this.getAttribute('type') || 'span';
  }

  get checkId() {
    return this.getAttribute('checkid');
  }

  get pattern() {
    return this.getAttribute('pattern');
  }

  handleInput() {
    this.render();
  }

validateInput() {
  if (!this.inputElement) {
    return { isValid: false, missingParts: [] };
  }

  const value = this.inputElement.value;
  const patterns = this.pattern.split(',').map(p => p.trim());
  const missingParts = [];

  for (const pattern of patterns) {
    const match = pattern.match(/(.+)\{(\d+)\}/);
    let regex;
    let requiredCount = 1;

    if (match) {
      regex = new RegExp(match[1], 'g');
      requiredCount = parseInt(match[2], 10);
    } else {
      regex = new RegExp(pattern, 'g');
    }

    const matches = value.match(regex) || [];
    const missingCount = requiredCount - matches.length;

    if (missingCount > 0) {
      // Constructing the message to reflect missing parts more clearly
      missingParts.push(`${missingCount} que sea ${pattern.replace(/\{.*\}/, '')}`);
    }
  }

  const isValid = missingParts.length === 0;

  return { isValid, missingParts };
}

  render() {
    const { isValid, missingParts } = this.validateInput();
    let messageElement = this.shadowRoot.querySelector(this.type);

    if (!messageElement) {
      messageElement = document.createElement(this.type);
      this.shadowRoot.appendChild(messageElement);
    }

    messageElement.className = 'message';
    if (this.inputElement.value.trim() === '') {
      messageElement.classList.add('hidden');
      messageElement.classList.remove('display');
    } else {
      if (isValid) {
        messageElement.classList.add('hidden');
        messageElement.classList.remove('display');
      } else {
        messageElement.textContent = `Falta: ${missingParts.join(', ')}`;
        messageElement.classList.add('display');
        messageElement.classList.remove('hidden');
      }
    }
  }
}

customElements.define('validation-component', ValidationComponent);
