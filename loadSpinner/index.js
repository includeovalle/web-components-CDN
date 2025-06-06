// usage:
// component must be son of a relative element and this will cover/wrap that element
// <loading-component loadingtime="1700" class='["custom-overlay", "custom-spinner"]'>
//   <h1>Data Loaded!</h1>
//   <p>This content will be shown after the loading spinner disappears.</p>
// </loading-component>
//
// This exposes css with ::part(overlay)
// This exposes css with ::part(spinner)

class LoadingComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');

    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.setAttribute('part', 'overlay');

    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    spinner.setAttribute('part', 'spinner');

    overlay.appendChild(spinner);

    const slot = document.createElement('slot');

    wrapper.appendChild(overlay);
    wrapper.appendChild(slot);

    const style = document.createElement('style');
    style.textContent = `
      .wrapper {
        position: relative;
        display: block;
      }

      .overlay {
        position: absolute;
        inset: 0;
        z-index: 5;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 5px solid rgba(0, 0, 0, 0.2);
        border-top-color: black;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    this.shadowRoot.append(style, wrapper);

    this.wrapper = wrapper;
    this.overlay = overlay;
  }

  connectedCallback() {
    const delay = parseInt(this.getAttribute('loadingtime') || '1700', 10);
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, delay);
  }
}

customElements.define('loading-component', LoadingComponent);
