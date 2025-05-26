/*
 *
Sat Oct 12 09:14:21 PM CST 2024
Sat May  3 11:56:38 AM CST 2025
Mié 07 may 2025 18:23:51 CST

@params:

searchAttribute: string; represents the attribute we are aiming inside the API

endpoint: string; represents the API we we will search for Either endpoint or sessionStorage(storedData)

checkValue?: string; represents a concrete value we would expect from that API in order to meet conditions if that fails checks if slot default is provided to render its content if nothing comes doesn'nt render anything We added support for multiple values to check, coma separated  e.g. searchAttribute="docente,alumno"

not?: boolean; if true negates the query to its oposite  similar to !

storedData?: Represents if this will be calling a cached localStore or if will be making the API request on every render




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

    // Hide all slotted content initially
    this.querySelectorAll('[slot]').forEach((el) => (el.hidden = true));

    // Shadow styles
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

    // Spinner
    this.spinner = document.createElement('div');
    this.spinner.className = 'spinner';
    this.spinner.setAttribute('part', 'spinner');

    // Named slots
    this.slotTag = document.createElement('slot');
    this.slotTag.name = 'tag';

    this.slotDefault = document.createElement('slot');
    this.slotDefault.name = 'default';

    // Inject directly (no wrapper)
    this.shadowRoot.append(this.spinner, this.slotTag, this.slotDefault);
  }

  async connectedCallback() {
    const endpoint = this.getAttribute('endpoint');
    const attrPath = this.getAttribute('searchAttribute');
    const checkValueRaw = this.getAttribute('checkValue');
    const storeName = this.getAttribute('storedData');
    const negate = this.getAttribute('not') === 'true';

    // Clean up attributes
    this.removeAttribute('endpoint');
    this.removeAttribute('searchAttribute');
    this.removeAttribute('checkValue');

    if (!endpoint || !attrPath) {
      console.error('[async-if] ❌ Missing required attributes.');
      return;
    }

    await new Promise((res) => setTimeout(res, 100)); // Optional delay

    try {
      let store = JSON.parse(sessionStorage.getItem(storeName) || '{}');
      let data = store[endpoint];

      if (!data) {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`❌ ${response.status} - ${response.statusText}`);
        data = await response.json();
        store[endpoint] = data;
      }

      const value = this.getDeepValue(data, attrPath);
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

  getDeepValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}

customElements.define('async-if', AsyncIf);
