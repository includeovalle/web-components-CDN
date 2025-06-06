/*
 * <copy-params-to-clipboard onSuccess="✅ Copiado" baseURL="https://www.eduba.lat/protected">
 * </copy-params-to-clipboard> 
 */

class CopyParamsToClpboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.attachTemplate();
  }

  attachTemplate() {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(`
      button {
        cursor: pointer;
        font-size: 1rem;
        padding: 0.5em 1em;
        user-select: none;
      }
      .label {
        margin-left: 0.3em;
      }
    `);

    this.shadowRoot.adoptedStyleSheets = [styleSheet];

    const slot = document.createElement('slot');
    const defaultButton = document.createElement('button');
    defaultButton.setAttribute('part', 'edit-button');
    defaultButton.innerHTML = `🗒️ <span class="label">Copiar link para compartir</span>`;
    slot.appendChild(defaultButton);

    this.shadowRoot.appendChild(slot);
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) {
      console.error('[copy-link-button] ❌ No <slot> found.');
      return;
    }

    const handleSlotChange = () => {
      const assigned = slot.assignedElements({ flatten: true });
      if (!assigned.length) {
        console.warn('[copy-link-button] ⚠️ No elements assigned to slot.');
        return;
      }
      this.button = assigned[0];
      this.labelSpan = this.button.querySelector('.label') || null;

      this.button.style.cursor = 'pointer';
      this.button.addEventListener('click', this.onClick.bind(this));
    };

    if (slot.assignedElements().length) {
      handleSlotChange();
    } else {
      slot.addEventListener('slotchange', handleSlotChange);
    }
  }

  onClick() {
    this.dispatchEvent(
      new CustomEvent('button-clicked', {
        bubbles: true,
        composed: true,
      })
    );

        const baseURL = this.getAttribute('baseURL') || '/';
    const params = new URLSearchParams(window.location.search).toString();
    const urlToCopy = `${baseURL}?${params}`;

    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        const successText = this.getAttribute('onSuccess') || '¡Copiado!';
        if (this.labelSpan) {
          this.originalLabel = this.labelSpan.textContent;
          this.labelSpan.textContent = successText;
          setTimeout(() => {
            this.labelSpan.textContent = this.originalLabel;
          }, 2000);
        }
      })
      .catch((err) => {
        console.error('[copy-link-button] Copy failed:', err);
      });
  }
}

customElements.define('copy-params-to-clipboard', CopyParamsToClpboard);
