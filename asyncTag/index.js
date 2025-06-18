/*
Vie 30 may 2025 06:18:02 CST

* @params:
*     endpoint: Representa el enpoint al que haremos el llamado
*     searchAttribute:  Representa el atributo que buscaremos en ese endpoint
*     storedData?: Representa el nombre del proxy-store al que haremos el llamado http, 
*     si no se provee un storedData este componente hara un llamado al endpoint
*     en cada recarga de pagina o navegacion interna en la app


USO:
<async-tag endpoint="/api/user" searchAttribute="user" storedData="localStore">
  <strong slot="tag">user name</strong>
</async-tag>
*
*
* NOTA: adicional permite al usuario final el control de los estilos del spiner utilizando ::part
* donde wrapper es el contenedor del spinner
*
*   ::part(spinner)
*   ::part(wrapper)
*
          <style>
            async-tag::part(spinner) {
              border-top-color: var(--primary);
            }
            async-tag::part(wrapper) {
              border-top-color: var(--primary);
            }
          </style>
*/

class InjectorGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = this.shadowRoot;

    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    wrapper.setAttribute('part', 'wrapper');

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.setAttribute('part', 'spinner');

    const slot = document.createElement('slot');
    slot.name = 'tag';

    wrapper.append(spinner, slot);
    shadow.append(wrapper);

    const style = new CSSStyleSheet();
    style.replaceSync(`
.wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  vertical-align: middle;
  line-height: 1;
}

.spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #999;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-sizing: border-box; /* prevent size overflow */
  flex-shrink: 0;         /* avoid shrinking in flex container */
}

.spinner[hidden] {
  display: none;
}

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

`);
    shadow.adoptedStyleSheets = [style];
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    const endpoint = this.getAttribute('endpoint');
    const attrPath = this.getAttribute('searchAttribute');
    const storeName = this.getAttribute('storedData');
    const delay = parseInt(this.getAttribute('delay') || '0', 10);
    const skipDelayIfCached = this.getAttribute('skipDelayIfCached') === 'true';
    const checkValueRaw = this.getAttribute('checkValue');

    const slot = this.shadowRoot.querySelector('slot[name="tag"]');
    const assigned = slot.assignedElements()?.[0];

    if (!assigned || !endpoint || !attrPath) return;

    const spinner = this.shadowRoot.querySelector('.spinner');

    const getDeepValue = (obj, path) => {
      return path
        .replace(/\[(\w+)\]/g, '.$1')
        .split('.')
        .reduce((acc, key) => acc?.[key], obj);
    };

    const valueMatches = (value) => {
      if (checkValueRaw == null) return value;
      const expected = checkValueRaw.split(',').map((v) => v.trim());

      if (Array.isArray(value)) {
        const found = expected.find((val) => value.includes(val));
        return found ?? null;
      }

      return expected.includes(String(value)) ? value : null;
    };

    const updateDisplay = (data) => {
      try {
        const raw = data?.[endpoint] ?? data;
        const deepValue = getDeepValue(raw, attrPath);
        const finalValue = valueMatches(deepValue);
        assigned.textContent = finalValue ?? 'No data available';
      } catch (err) {
        assigned.textContent = 'Invalid path';
      }
      spinner.hidden = true;
    };

    const runWithSpinner = (fn) => {
      spinner.hidden = false;
      fn();
    };

    const loadFromStore = () => {
      const cached = sessionStorage.getItem(storeName);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          updateDisplay(parsed);
        } catch (err) {
          assigned.textContent = 'Error parsing store';
          spinner.hidden = true;
        }
      } else {
        assigned.textContent = 'No data available';
        spinner.hidden = true;
      }
    };

    const loadFromEndpoint = () => {
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => updateDisplay({ [endpoint]: data }))
        .catch(() => {
          assigned.textContent = 'Fetch failed';
          spinner.hidden = true;
        });
    };

    const execute = () => {
      if (storeName) {
        runWithSpinner(loadFromStore);
      } else {
        runWithSpinner(loadFromEndpoint);
      }
    };

    if (storeName) {
      this.addEventListener('store-updated', (e) => {
        if (e.detail?.key === storeName) {
          updateDisplay(e.detail.data);
        }
      });

      const cached = sessionStorage.getItem(storeName);
      if (cached && skipDelayIfCached) {
        execute(); // No delay
      } else {
        setTimeout(execute, delay);
      }
    } else {
      setTimeout(execute, delay);
    }
  }
}

customElements.define('async-tag', InjectorGenerator);
