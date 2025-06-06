/*
    Dom 01 jun 2025 20:27:36 CST
    lun 02 jun 2025 18:52:34 CST
 *
                <data-to-params listenTo="data-to-params" closest="tr" infoToParam='["id", "nombre"]'>
                </data-to-params>

@params:
listenTo: string; represents a valid value for querySelector to pick
closest: string; represents the .closest() element on which we will search for ids
infoToParam: array; reprents the ids we will put into params
 *
 */

class DataToParams extends HTMLElement {
  constructor() {
    super();
    this.attachTemplate();
  }

  attachTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `<slot></slot>`;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');

    if (!slot) {
      console.error('[data-to-params] ❌ No <slot> found inside shadowRoot.');
      return;
    }

    const tryAttach = () => {
      const nodes = slot.assignedElements();
      if (!nodes.length) {
        console.warn('[data-to-params] ⚠️ No elements assigned in slot.');
        return;
      }

      this.attachClickHandler(nodes[0]);
    };

    // Handle lazy slotted content
    if (slot.assignedElements().length) {
      tryAttach();
    } else {
      slot.addEventListener('slotchange', tryAttach);
    }
  }

  attachClickHandler(clickable) {
    clickable.style.cursor = 'pointer';

    clickable.addEventListener('click', () => {
      // Dispatch custom event so parent can listen
      this.dispatchEvent(
        new CustomEvent('button-clicked', {
          bubbles: true,
          composed: true, // allows it to escape shadow root
        })
      );

      this.sendDataToParams();
    });
  }

  sendDataToParams() {
    const closestSelector = this.getAttribute('closest');
    let infoToParam = [];

    try {
      infoToParam = JSON.parse(this.getAttribute('infoToParam') || '[]');
    } catch (e) {
      console.error('[data-to-params] ❌ Invalid JSON in infoToParam attribute:', e);
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (closestSelector) {
      const closestElement = this.closest(closestSelector);
      if (!closestElement) {
        console.warn('[data-to-params] ⚠️ No element found for closest selector:', closestSelector);
        return;
      }

      for (const param of infoToParam) {
        if (typeof param === 'string' && param.trim() !== '') {
          const el = closestElement.querySelector(`#${param}`);
          if (el) {
            const val = el.value ?? el.textContent.trim();
            params.set(param, val);
          } else {
            console.warn(`[data-to-params] ⚠️ No element found with ID #${param}`);
          }
        }
      }

      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = `${baseUrl}?${params.toString()}`;
      window.history.pushState({}, '', newUrl);
    }
  }
}

customElements.define('data-to-params', DataToParams);
