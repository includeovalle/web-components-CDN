// async-tag-injector.js
// <async-tag stateThis="true" type="span" endpoint="/api/user" searchAttribute="user"> default value </async-tag>


const templates = {
  span: document.createElement('template'),
  h1: document.createElement('template'),
  p: document.createElement('template'),
  div: document.createElement('template'),
  a: document.createElement('template'),
};

templates.span.innerHTML = `<span><slot></slot></span>`;
templates.h1.innerHTML = `<h1><slot></slot></h1>`;
templates.p.innerHTML = `<p><slot></slot></p>`;
templates.div.innerHTML = `<div><slot></slot></div>`;
templates.a.innerHTML = `<a><slot></slot></a>`;

class InjectorGenerator extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const type = this.getAttribute('type') || 'span';
    const className = this.getAttribute('class') || '';
    const endpoint = this.getAttribute("endpoint");
    const attribute = this.getAttribute("searchAttribute");
    const stateThis = this.getAttribute("stateThis");

    const template = templates[type];
    const content = template.content.cloneNode(true);
    const element = content.firstChild;
    element.className = className;

    // Preserve initial content
    const initialContent = this.innerHTML.trim();

    // Clear the initial content
    this.innerHTML = '';
    this.appendChild(content);

    // Set initial content
    element.innerText = initialContent;

    // Global cache object and in-progress tracking
    if (!window._asyncTagState) {
      window._asyncTagState = {}; // Initialize cache if not present
    }
    if (!window._asyncTagFetchInProgress) {
      window._asyncTagFetchInProgress = {}; // Track fetch requests
    }

    // Create a Proxy for the cache and fetch-in-progress state
    const cacheProxy = new Proxy(window._asyncTagState, {
      get: async (target, prop) => {
        const decodedProp = decodeURIComponent(prop);
        
        if (decodedProp in target) {
          // console.log(`Using cached data for: ${decodedProp}`);
          return target[decodedProp]; // Return cached data if available
        } 
        
        if (window._asyncTagFetchInProgress[decodedProp]) {
          // console.log(`Fetch already in progress for: ${decodedProp}. Waiting...`);
          // Wait until the ongoing fetch is complete
          return window._asyncTagFetchInProgress[decodedProp];
        }

        // console.log(`No cached data for: ${decodedProp}. Fetching from API...`);
        
        // Fetch in progress, return a Promise for all awaiting calls
        window._asyncTagFetchInProgress[decodedProp] = fetch(decodedProp)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            target[decodedProp] = data; // Cache the fetched data
            // console.log(`Data cached for: ${decodedProp}`);
            return data;
          })
          .finally(() => {
            delete window._asyncTagFetchInProgress[decodedProp]; // Cleanup after fetch
          });
          
        return window._asyncTagFetchInProgress[decodedProp];
      },
    });

    // Fetch data or use cached state
    try {
      if (!endpoint) {
        console.error('No endpoint provided');
        return;
      }

      let query;
      const encodedEndpoint = encodeURIComponent(endpoint); // Cache and fetch based on the encoded endpoint
      if (stateThis) {
        const data = await cacheProxy[encodedEndpoint]; // Fetch or use cached data
        // console.log('Using Proxy with state management', data[attribute]);
        query = data ? data[attribute] : null;
      } else {
        console.log('StateThis attribute not present. Fetching data from API...');
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        query = data[attribute];
      }

      // Clean up attributes
      this.removeAttribute('endpoint');
      this.removeAttribute('error');
      this.removeAttribute('type');
      this.removeAttribute('searchattribute');

      // Log final result
      // console.log('Final query result:', query);
      element.innerText = query ? query : "default missing endpoint attribute";

    } catch (error) {
      console.error('Error:', error);
    }
  }
}

customElements.define('async-tag', InjectorGenerator);
