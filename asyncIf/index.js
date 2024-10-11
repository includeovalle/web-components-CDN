// This component receibes a localStore, and enpoint  checks for info,
// if that success will render slot="tag"
// if that fails checks if slot default is provided to render its content
// if nothing comes doesn'nt render anything
//
// USAGE:
// <async-if endpoint="/api/teams"  storedData="localStore" searchAttribute="teams">
//   <h2 slot="tag"> Los equipos a los que perteneces</h2>
//   <h2> slot="default"> Aun no tienes Equipos</h2>
// </async-if>

class AsyncIf extends HTMLElement {
  constructor() {
    super();
    this.template = document.createElement('template');
    this.template.innerHTML = `<slot name="tag" style="display: none"></slot>`;
  }

  async connectedCallback() {
    const endpoint = this.getAttribute('endpoint');
    const attribute = this.getAttribute('searchAttribute');
    const _data = this.getAttribute('storedData');

    try {
      if (!endpoint) {
        console.error('No endpoint provided');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const storedData = window[_data] ? window[_data][endpoint] : null;
      let data;

      if (storedData) {
        data = storedData;
      } else {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Error fetching from ${endpoint}: ${response.statusText}`);
        }
        data = await response.json();

        if (window[_data]) {
          window[_data][endpoint] = data;
        } else {
          window[_data] = { [endpoint]: data };
        }
      }

      if (Array.isArray(data[attribute]) && data[attribute].length === 0) {
        this.renderDefaultOnly();
      } else {
        this.renderTagOnly();
      }
    } catch (error) {
      console.error('Error:', error);
      this.renderDefaultOnly();
    }
  }

  renderDefaultOnly() {
    const defaultSlotContent = this.querySelector('[slot="default"]');
    const tagSlotContent = this.querySelector('[slot="tag"]');
    if (defaultSlotContent) {
      if (tagSlotContent) tagSlotContent.remove();
      this.appendChild(defaultSlotContent); // Append without cloning
    } else {
      this.remove(); // Remove component if no default slot
    }
  }

  renderTagOnly() {
    const tagSlotContent = this.querySelector('[slot="tag"]');
    const defaultSlotContent = this.querySelector('[slot="default"]');
    if (defaultSlotContent) defaultSlotContent.remove();
    this.appendChild(this.template.content.cloneNode(true));

    if (tagSlotContent) {
      tagSlotContent.style.display = 'block';
    }
  }
}

// Define the custom element
customElements.define('async-if', AsyncIf);
