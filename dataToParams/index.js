/*
    Dom 01 jun 2025 20:27:36 CST
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
      console.error('[open-dialog] ❌ No <slot> found inside shadowRoot.');
      return;
    }

    const nodes = slot.assignedElements();

    if (!nodes.length) {
      console.warn('[open-dialog] ⚠️ No elements assigned yet. Listening for slotchange...');
      // Attach listener in case they come later
      slot.addEventListener('slotchange', () => {
        this.attachClickHandler(slot);
      });
      return;
    }

    this.attachClickHandler(slot);
  }

  attachClickHandler(slot) {
    const nodes = slot.assignedElements();

    if (!nodes.length) {
      console.error(
        '[open-dialog] ❌ No slotted elements found when trying to attach click handler.'
      );
      return;
    }

    const clickable = nodes[0];

    clickable.style.cursor = 'pointer';

    clickable.addEventListener('click', () => {
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
          const temp = closestElement.querySelector(`#${param}`);
          if (temp) {
            const val = temp.value ?? temp.textContent.trim();
            params.set(param, val);
          } else {
            console.warn(`[data-to-params] ⚠️ No element found with ID #${param}`);
          }
        }
      }

      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = `${baseUrl}?${params.toString()}`;
      window.location.href = newUrl;
    }
  }
}

customElements.define('data-to-params', DataToParams);
