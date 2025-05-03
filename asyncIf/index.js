
// Sat Oct 12 09:14:21 PM CST 2024
// Sat May  3 11:56:38 AM CST 2025
//
// @params
// searchAttribute: string; represents the attribute we are aiming inside the API
// endpoint: string; represents the API we we will search for Either endpoint or storedData(window.storeName or sessionStorage)
// checkValue?: string; represents a concrete value we would expect from that API in order to meet conditions if that fails checks if slot default is provided to render its content if nothing comes doesn'nt render anything
// storedData?: Represents if this will be calling a cached localStore or if will be making the API request on every render
//
// USAGE:
// <async-if
// endpoint="/api/teams"
// storedData="localStore"
// searchAttribute="teams"
// >
//   <h2 slot="tag"> Los equipos a los que perteneces</h2>
//   <h2> slot="default"> Aun no tienes Equipos</h2>
// </async-if>
//
//
//<async-if
//   endpoint="/api/user/info"
//   storedData="localStore"
//   searchAttribute="role"
//   checkValue="docente"
// >
//<async-if
//   endpoint="/api/user/info"
//   storedData="localStore"
//   searchAttribute="address.city"
//   checkValue="Oaxaca"
// >
//
//<async-if
//   endpoint="/api/user/info"
//   storedData="localStore"
//   searchAttribute="teams.length"
// >
//
// NOTE: <styles>: safely exposes spinner for customization using
// ::part(wrapper)
// ::part(spinner)

class AsyncIf extends HTMLElement {
  constructor() {
    super();

    // Apply early hiding to avoid flashing
    this.querySelectorAll('[slot]').forEach((el) => el.classList.remove('shown'));

    const style = new CSSStyleSheet();
    style.replaceSync(`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .wrapper {
        text-align: center;
      }

      .spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid #ccc;
        border-top: 3px solid #000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 1rem auto;
      }

      .hidden {
        display: none !important;
      }

      ::slotted(*) {
        display: none;
      }

      .slots-ready ::slotted(.shown) {
        display: block;
      }
    `);

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [style];

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'wrapper';
    this.wrapper.setAttribute('part', 'wrapper');

    this.spinner = document.createElement('div');
    this.spinner.className = 'spinner';
    this.spinner.setAttribute('part', 'spinner');

    this.slotTag = document.createElement('slot');
    this.slotTag.name = 'tag';

    this.slotDefault = document.createElement('slot');
    this.slotDefault.name = 'default';

    this.wrapper.append(this.spinner, this.slotTag, this.slotDefault);
    this.shadowRoot.appendChild(this.wrapper);
  }

  async connectedCallback() {
    const endpoint = this.getAttribute('endpoint');
    const attrPath = this.getAttribute('searchAttribute');
    const checkValue = this.getAttribute('checkValue');
    const storeName = this.getAttribute('storedData');

    this.removeAttribute('endpoint');
    this.removeAttribute('searchAttribute');
    this.removeAttribute('checkValue');

    if (!endpoint || !attrPath || !storeName) {
      console.error('[async-if] ❌ Missing required attributes.');
      return;
    }

    await new Promise((res) => setTimeout(res, 100)); // slight delay to stabilize

    try {
      let store = JSON.parse(sessionStorage.getItem(storeName) || '{}');
      let data = store[endpoint];

      if (!data) {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`❌ ${response.status} - ${response.statusText}`);
        data = await response.json();
        store[endpoint] = data;
        sessionStorage.setItem(storeName, JSON.stringify(store));
      }

      const value = this.getDeepValue(data, attrPath);
      const valid = checkValue != null ? value == checkValue : Boolean(value);

      this.spinner.classList.add('hidden');

      this.querySelectorAll('[slot]').forEach((el) => {
        el.classList.remove('shown');
        if (valid && el.slot === 'tag') el.classList.add('shown');
        if (!valid && el.slot === 'default') el.classList.add('shown');
      });

      this.wrapper.classList.add('slots-ready');
    } catch (err) {
      console.error('[async-if] ❌ Error loading or parsing data:', err);
      this.spinner.classList.add('hidden');
      this.querySelectorAll('[slot="default"]').forEach((el) => el.classList.add('shown'));
    }
  }

  getDeepValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}

customElements.define('async-if', AsyncIf);
