// Tue Apr 15 07:51:45 PM CST 2025
//---------USAGE----------
//  <validation-component
//      class="this can also receive classes"
//      checkid="reg_password"
//      pattern="lowercase='2', uppercase='2', number='2', special='1'"
//      >
//  </validation-component>
//  <style>
// validation-component::part(unmatched) {
//   font-size: 85%;
//   font-weight: bold;
//   color: var(--primary);
//   letter-spacing: 1px;
//   margin-top: 2px;
// } 
//  </style>


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
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes fadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; display: none; }
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
        text-decoration: line-through;
        animation-name: fadeOut;
        animation-duration: 1s;
        animation-fill-mode: both;
      }
      .unmatched {
        color: deeppink;
      }
    `);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];

    this.listElement = null; // 🛠️ Cache the list element
  }

  connectedCallback() {
    const form = this.closest('form');
    if (form && this.checkId) {
      this.inputElement = form.querySelector(`#${this.checkId}`);
      if (this.inputElement) {
        this.inputElement.addEventListener('input', this.handleInput.bind(this));
      }
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
    return this.getAttribute('type') || 'ul';
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

    // ⚡ Only create listElement once
    if (!this.listElement) {
      this.listElement = document.createElement(this.type);
      this.listElement.setAttribute('part', 'list'); // 🛠️ Add part=list to whole list
      this.shadowRoot.appendChild(this.listElement);
    }

    // Reset content
    this.listElement.innerHTML = '';
    this.listElement.className = this.className || '';

    const allMatched = results.every(result => result.isMatched);

    if (this.inputElement.value.trim() === '' || allMatched) {
      this.style.display = 'none';
    } else {
      this.style.display = 'block';

      results.forEach(({ message, isMatched, missingCount }) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Falta: ${missingCount} ${message}`;
        const state = isMatched ? 'matched' : 'unmatched';
        listItem.className = state;
        listItem.setAttribute('part', state); // 🛠️ Each item exposes part
        this.listElement.appendChild(listItem);
      });
    }
  }
}

customElements.define('validation-component', ValidationComponent);
