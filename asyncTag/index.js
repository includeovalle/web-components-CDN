/*
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
      .spinner {
        display: none;
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #999;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    `);
    shadow.adoptedStyleSheets = [style];
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    const endpoint = this.getAttribute('endpoint');
    const attribute = this.getAttribute('searchAttribute');
    const storeName = this.getAttribute('storedData');
    const slot = this.shadowRoot.querySelector('slot[name="tag"]');
    const assigned = slot.assignedElements()?.[0];

    if (!assigned || !endpoint || !attribute) return;

    const spinner = this.shadowRoot.querySelector('.spinner');
    const updateDisplay = (data) => {
      const value = data?.[endpoint]?.[attribute];
      assigned.textContent = value ?? 'No data available';
    };

    spinner.style.display = 'inline-block';

    const load = () => {
      const cached = sessionStorage.getItem(storeName);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          updateDisplay(parsed);
        } catch (err) {
          assigned.textContent = 'Error parsing store';
        }
      } else {
        assigned.textContent = 'No data available';
      }
      spinner.style.display = 'none';
    };

    if (storeName) {
      this.addEventListener('store-updated', (e) => {
        if (e.detail?.key === storeName) {
          updateDisplay(e.detail.data);
        }
      });
      load();
    } else {
      // Fallback if no proxy-store is defined
      fetch(endpoint)
        .then(res => res.json())
        .then(data => {
          assigned.textContent = data[attribute] ?? 'No data available';
        })
        .catch(() => {
          assigned.textContent = 'Fetch failed';
        })
        .finally(() => {
          spinner.style.display = 'none';
        });
    }
  }
}

customElements.define('async-tag', InjectorGenerator);
