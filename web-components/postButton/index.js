class LogoutButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(`
      :host {
        display: inline-block;
        cursor: pointer;
        padding: 0.5rem 1rem;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        text-align: center;
      }

      :host(.loading) {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      :host(.error) {
        background-color: #dc3545;
      }
    `);

    this.shadowRoot.adoptedStyleSheets = [stylesheet];

    this.button = document.createElement('button');
    this.button.textContent = this.textContent.trim() || 'Logout';

    this.shadowRoot.appendChild(this.button);
  }

  connectedCallback() {
    this.button.addEventListener('click', () => this.handleLogout());
  }

  disconnectedCallback() {
    this.button.removeEventListener('click', () => this.handleLogout());
  }

  async handleLogout() {
    const endpoint = this.getAttribute('endpoint');
    const href = this.getAttribute('href');
    const updatedText = this.getAttribute('updatedText') || 'Successfully logged out, redirecting...';
    const errorText = this.getAttribute('error') || 'Something went wrong';

    if (!endpoint || !href) {
      console.error('Endpoint and href attributes are required.');
      return;
    }

    this.button.classList.add('loading');
    this.button.textContent = 'Logging out...';

    try {
      const response = await fetch(endpoint, { method: 'POST' });

      if (response.ok) {
        this.button.textContent = updatedText;
        setTimeout(() => {
          window.location.href = href;
        }, 1900);
      } else {
        throw new Error();
      }
    } catch (error) {
      this.button.textContent = errorText;
      this.button.classList.add('error');
    } finally {
      this.button.classList.remove('loading');
    }
  }
}

customElements.define('post-button', LogoutButton);
