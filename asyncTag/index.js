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

const wrapper = document.createElement('div');
wrapper.className = 'wrapper';
wrapper.setAttribute('part', 'wrapper');

const spinner = document.createElement('div');
spinner.className = 'spinner';
spinner.setAttribute('part', 'spinner');

const slot = document.createElement('slot');
slot.name = 'tag';

wrapper.appendChild(spinner);
wrapper.appendChild(slot);

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(`
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

class InjectorGenerator extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [styleSheet];
    shadow.appendChild(wrapper.cloneNode(true));
  }

  async connectedCallback() {
    if (this._initialized) {
      console.log('[async-tag] ⚠️ Already initialized — skipping duplicate connectedCallback');
      return;
    }
    const endpoint = this.getAttribute('endpoint');
    const attribute = this.getAttribute('searchAttribute');
    const _data = this.getAttribute('storedData');

    const slotElement = this.shadowRoot.querySelector('slot[name="tag"]');
    const assignedElements = slotElement.assignedNodes();
    const assignedElement = assignedElements.length > 0 ? assignedElements[0] : null;

    if (!assignedElement) {
      console.error("No element assigned to the 'tag' slot.");
      return;
    }

    const initialContent = assignedElement.textContent.trim();
    const spinner = this.shadowRoot.querySelector('.spinner');
    spinner.style.display = 'inline-block';

    try {
      if (!endpoint) {
        console.error('No endpoint provided');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 180));
      let storedData = window[_data]?.[endpoint];

      if (!storedData) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        storedData = window[_data]?.[endpoint];
      }

      if (storedData) {
        assignedElement.textContent = storedData[attribute] || 'No data available';
      } else {
        assignedElement.textContent = initialContent || 'default missing endpoint attribute';

        const response = await fetch(endpoint);
        if (!response.ok)
          throw new Error(`Error fetching from ${endpoint}: ${response.statusText}`);
        const data = await response.json();

        window[_data] = { ...(window[_data] || {}), [endpoint]: data };
        assignedElement.textContent = data[attribute] || 'No data available';
      }
    } catch (error) {
      console.error('Error:', error);
      assignedElement.textContent = initialContent;
    } finally {
      spinner.style.display = 'none';
    }
  }
}

customElements.define('async-tag', InjectorGenerator);

