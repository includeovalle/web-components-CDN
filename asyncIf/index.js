/*
 *
Sat Oct 12 09:14:21 PM CST 2024
Sat May  3 11:56:38 AM CST 2025
Mié 07 may 2025 18:23:51 CST
vie 30 may 2025 06:02:16 CST

* @params:
*     endpoint: Representa el enpoint al que haremos el llamado
*     searchAttribute:  Representa el atributo que buscaremos en ese endpoint
*     storedData?: Representa el nombre del proxy-store al que haremos el llamado http, 
*     si no se provee un storedData este componente hara un llamado al endpoint
*     en cada recarga de pagina o navegacion interna en la app
*     delay?: el retraso en milisegundos antes de hacer cualquier verificacion del endpoint
*     skipDelayIfCached?: is el valor es true, ignora el delay y sirve de inmediato




USAGE:
<async-if
endpoint="/api/teams"
storedData="localStore"
searchAttribute="teams"
>
  <h2 slot="tag"> Los equipos a los que perteneces</h2>
  <h2> slot="default"> Aun no tienes Equipos</h2>
</async-if>


<async-if
  endpoint="/api/user/info"
  storedData="localStore"
  searchAttribute="role"
  checkValue="docente"
>
<async-if
  endpoint="/api/user/info"
  storedData="localStore"
  searchAttribute="address.city"
  checkValue="Oaxaca"
>

<async-if
  endpoint="/api/user/info"
  storedData="localStore"
  searchAttribute="teams.length"
>
<async-if
  endpoint="/api/user/info"
  searchAttribute="role"
  checkValue="docente,admin"
  storedData="localStore"
>


<async-if
        endpoint="/api/user/info"
        searchAttribute="role"
        checkValue="alumno"
        not="true"
        storedData="localStore"
      >
        <div slot="tag">para docentes
           <p>Esto se muestra para todos menos para alumno</p>
        </div>
</async-if>



NOTE: <styles>: safely exposes spinner for customization using
::part(wrapper)
::part(spinner)
 *
 *
 *
*/

class AsyncIf extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('[slot]').forEach((el) => (el.hidden = true));

    const style = new CSSStyleSheet();
    style.replaceSync(`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
    `);

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [style];

    this.spinner = document.createElement('div');
    this.spinner.className = 'spinner';
    this.spinner.setAttribute('part', 'spinner');

    this.slotTag = document.createElement('slot');
    this.slotTag.name = 'tag';

    this.slotDefault = document.createElement('slot');
    this.slotDefault.name = 'default';

    this.shadowRoot.append(this.spinner, this.slotTag, this.slotDefault);
  }

  async connectedCallback() {
    const endpoint = this.getAttribute('endpoint');
    const attrPath = this.getAttribute('searchAttribute');
    const checkValueRaw = this.getAttribute('checkValue');
    const storeName = this.getAttribute('storedData');
    const negate = this.getAttribute('not') === 'true';
    const delay = Number(this.getAttribute('delay') || 0);
    const skipDelayIfCached = this.getAttribute('skipDelayIfCached') === 'true';

    this.removeAttribute('endpoint');
    this.removeAttribute('searchAttribute');
    this.removeAttribute('checkValue');

    if (!endpoint || !attrPath) {
      console.error('[async-if] ❌ Missing required attributes.');
      return;
    }

    // Pull store *before* optional delay
    let store = {};
    let cachedData = null;
    if (storeName) {
      try {
        store = JSON.parse(sessionStorage.getItem(storeName) || '{}');
        cachedData = store[endpoint];
      } catch (e) {
        console.warn('[async-if] ⚠️ Invalid or empty sessionStorage:', e);
      }
    }

    // Respect delay only if data is not cached or skipDelayIfCached is false
    if (!(skipDelayIfCached && cachedData)) {
      await new Promise((res) => setTimeout(res, delay));
    }

    try {
      let data = cachedData;

      if (!data) {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`❌ ${response.status} - ${response.statusText}`);
        data = await response.json();

        if (storeName) {
          store[endpoint] = data;
          sessionStorage.setItem(storeName, JSON.stringify(store));
        }
      }

      const value = this.getDeepValue(data, checkValueRaw, attrPath);
      let valid;

      if (checkValueRaw != null) {
        const values = checkValueRaw.split(',').map((v) => v.trim());
        valid = values.includes(String(value));
      } else {
        valid = Boolean(value);
      }

      if (negate) valid = !valid;

      this.spinner.hidden = true;

      const tagElements = Array.from(this.querySelectorAll('[slot="tag"]'));
      const defaultElements = Array.from(this.querySelectorAll('[slot="default"]'));

      if (valid) {
        defaultElements.forEach((el) => el.remove());
        tagElements.forEach((el) => (el.hidden = false));
      } else {
        tagElements.forEach((el) => el.remove());
        defaultElements.forEach((el) => (el.hidden = false));
      }
    } catch (err) {
      console.error('[async-if] ❌ Error loading or parsing data:', err);
      this.spinner.hidden = true;

      const tagElements = Array.from(this.querySelectorAll('[slot="tag"]'));
      tagElements.forEach((el) => (el.hidden = true));

      const defaultElements = Array.from(this.querySelectorAll('[slot="default"]'));
      defaultElements.forEach((el) => (el.hidden = false));
    }
  }

  getDeepValue(obj, firstKey, path) {
    if (!obj || !path) return undefined;
    // Navigate the "path"
    const base = path.split('.').reduce((acc, key) => acc?.[key], obj);
    // Once we’re there, pull out the firstKey
    return base[firstKey] ?? base;
  }
}

customElements.define('async-if', AsyncIf);
