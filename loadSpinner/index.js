// usage:
// <loading-component loadingtime="1700" class='["custom-overlay", "custom-spinner"]'>
//   <h1>Data Loaded!</h1>
//   <p>This content will be shown after the loading spinner disappears.</p>
// </loading-component>

class LoadingComponent extends HTMLElement {
  constructor() {
    super();
    // Create Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    // Create overlay and spinner elements
    this.overlay = document.createElement('div');
    this.overlay.classList.add('overlay');

    this.spinner = document.createElement('div'); // Save reference to spinner for future updates
    this.spinner.classList.add('spinner');
    this.spinner.id = 'spinner';

    this.overlay.appendChild(this.spinner);

    // Create a content slot for displaying data after loading
    const content = document.createElement('div');
    content.id = 'content';
    content.style.display = 'none'; // Initially hidden
    const slot = document.createElement('slot');
    content.appendChild(slot);

    // Append elements to the shadow DOM
    shadow.appendChild(this.overlay);
    shadow.appendChild(content);

    // Attach styles using CSSStyleSheet
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(`
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(0, 0, 0, 0.1);
        border-left-color: #000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `);
    shadow.adoptedStyleSheets = [stylesheet];
  }

  static get observedAttributes() {
    return ['loadingtime', 'class', 'icon'];
  }

  connectedCallback() {
    this.initLoading();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'class' && newValue) {
      this.applyExternalClass(newValue);
    }

    if (name === 'icon') {
      this.updateIcon(newValue);
    }
  }

  applyExternalClass(className) {
    // Apply external class to the internal overlay element
    this.overlay.classList.add(className);
  }

  updateIcon(icon) {
    // Clear previous content
    this.spinner.innerHTML = '';
    
    // Only add the image if the icon attribute is provided
    if (icon) {
      const img = document.createElement('img');
      img.src = icon;
      img.alt = 'Loading icon';
      this.spinner.appendChild(img);
    }
  }

  async initLoading() {
    const loadingTime = parseInt(this.getAttribute('loadingtime') || '1700'); // Default to 1.7 seconds
    const spinnerTimeout = new Promise((resolve) => setTimeout(resolve, loadingTime));

    const data = await this.fetchData(); // Simulated fetch (replace with actual)

    await spinnerTimeout; // Ensure minimum loading time is met

    if (data) {
      this.shadowRoot.getElementById('content').style.display = 'block';
      this.shadowRoot.querySelector('.overlay').style.display = 'none';
    }
  }

  async fetchData() {
    // Simulate a backend call with a delay (replace with actual fetch)
    return new Promise((resolve) => setTimeout(() => resolve(true), 500)); // Simulate fast fetch
  }
}

// Define the custom element
customElements.define('loading-component', LoadingComponent);
