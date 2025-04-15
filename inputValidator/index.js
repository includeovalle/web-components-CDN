class ValidationComponent extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'checkid', 'pattern'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(`
      @-webkit-keyframes fadeOut {
        0% {opacity: 1;}
        100% {opacity: 0;}
      }
      @keyframes fadeOut {
        0% {opacity: 1;}
        100% {opacity: 0; display: none;}
      }
      :host {
        display: none; /* Initially hidden */
      }
      .hidden {
        display: none;
      }
      .display {
        display: block;
      }
      .matched {
        text-decoration: line-through; /* Strikethrough for matched patterns */
        animation-name: fadeOut;
        animation-duration: 1s;
        animation-fill-mode: both;
      }
      .unmatched {
        color: deeppink; /* Optional: color for unmatched items */
      }
    `);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];
  }

  connectedCallback() {
    this.inputElement = document.getElementById(this.checkId);
    if (this.inputElement) {
      this.inputElement.addEventListener('input', this.handleInput.bind(this));
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
  }

  get type() {
    return this.getAttribute('type') || 'ul'; // Default type to 'ul'
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
    if (!this.inputElement) return [];

    const value = this.inputElement.value;
    const results = [];

    const fullPatternMap = {
      lowercase: {
        message: 'de minúscula',
        regex: /[a-z]/g,
      },
      uppercase: {
        message: 'de mayúscula',
        regex: /[A-Z]/g,
      },
      number: {
        message: 'de número',
        regex: /[0-9]/g,
      },
      special: {
        message: 'caracter especial',
        regex: /[^a-zA-Z0-9]/g,
      },
    };

    const patternString = this.pattern || '';
    const patternEntries = patternString
      .split(',')
      .map(p => p.trim())
      .map(p => {
        const [key, val] = p.split('=');
        return [key.trim(), Number(val.replace(/['"]/g, ''))];
      });

    for (const [key, requiredCount] of patternEntries) {
      const entry = fullPatternMap[key];
      if (entry) {
        const { message, regex } = entry;
        const matches = value.match(regex) || [];
        const matchCount = matches.length;
        const missingCount = Math.max(requiredCount - matchCount, 0);
        results.push({
          message,
          isMatched: missingCount === 0,
          missingCount,
        });
      }
    }

    return results;
  }

  render() {
    if (!this.inputElement) {
      this.style.display = 'none';
      return;
    }

    const results = this.validateInput();
    let listElement = this.shadowRoot.querySelector(this.type);

    if (this.className) {
      listElement.className = this.className;
    }
    if (!listElement) {
      listElement = document.createElement(this.type);
      this.shadowRoot.appendChild(listElement);
    }

    // Clear previous content
    listElement.innerHTML = '';
    listElement.className = this.className || '';

    const allMatched = results.every(result => result.isMatched);

    if (this.inputElement.value.trim() === '' || allMatched) {
      this.style.display = 'none'; // Hide the component if input is empty or all patterns are matched
    } else {
      this.style.display = 'block'; // Show the component if there are unmet requirements
      results.forEach(({ message, isMatched, missingCount }) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Falta: ${missingCount} ${message}`;
        listItem.className = isMatched ? 'matched' : 'unmatched';
        listElement.appendChild(listItem);
      });
    }
  }
}

customElements.define('validation-component', ValidationComponent);
