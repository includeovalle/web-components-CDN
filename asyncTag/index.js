      // <async-tag endpoint="/api/user" searchAttribute="user" stateThis="true">
      //   <span slot="tag"> user name</span>
      // </async-tag>

const template = document.createElement('template');
template.innerHTML = `
  <div class="loading" style="display: none;">Loading...</div> <!-- Loading indicator -->
  <slot name="tag"></slot> <!-- Named slot for dynamic content -->
`;

class InjectorGenerator extends HTMLElement {
  constructor() {
    super();
    // Attach the template content to the component
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    const endpoint = this.getAttribute('endpoint');
    const attribute = this.getAttribute('searchAttribute');
    const stateThis = this.getAttribute('stateThis') === "true"; // Ensure it's a boolean

    // Find the slot with name="tag"
    const slotElement = this.shadowRoot.querySelector('slot[name="tag"]');
    
    // Check for assigned element to the slot
    const assignedElements = slotElement.assignedNodes();
    const assignedElement = assignedElements.length > 0 ? assignedElements[0] : null;

    if (!assignedElement) {
      console.error("No element assigned to the 'tag' slot.");
      return;
    }

    // Preserve initial content in case fetch fails or is delayed
    const initialContent = assignedElement.textContent.trim();

    // Cache and fetch state initialization
    if (!window._asyncTagState) {
      window._asyncTagState = {}; // Initialize cache if not present
    }
    if (!window._asyncTagFetchInProgress) {
      window._asyncTagFetchInProgress = {}; // Track fetch requests
    }

    const loadingElement = this.shadowRoot.querySelector('.loading');
    loadingElement.style.display = 'block'; // Show loading indicator

    const cacheProxy = new Proxy(window._asyncTagState, {
      get: async (target, prop) => {
        const decodedProp = decodeURIComponent(prop);

        if (decodedProp in target) {
          return target[decodedProp]; // Return cached data if available
        }

        if (window._asyncTagFetchInProgress[decodedProp]) {
          return window._asyncTagFetchInProgress[decodedProp];
        }

        // Fetch in progress, return a Promise for all awaiting calls
        window._asyncTagFetchInProgress[decodedProp] = fetch(decodedProp)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            target[decodedProp] = data; // Cache the fetched data
            return data;
          })
          .finally(() => {
            delete window._asyncTagFetchInProgress[decodedProp]; // Cleanup after fetch
          });

        return window._asyncTagFetchInProgress[decodedProp];
      },
    });

    try {
      if (!endpoint) {
        console.error('No endpoint provided');
        return;
      }

      let query;
      const encodedEndpoint = encodeURIComponent(endpoint); // Cache and fetch based on the encoded endpoint
      if (stateThis) {
        const data = await cacheProxy[encodedEndpoint]; // Fetch or use cached data
        query = data ? data[attribute] : null;
      } else {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        query = data[attribute];
      }

      // Replace the initial content with the dynamic content
      assignedElement.textContent = query || initialContent || 'default missing endpoint attribute';

    } catch (error) {
      console.error('Error:', error);
      // If there's an error, the initial content remains
      assignedElement.textContent = initialContent;
    } finally {
      loadingElement.style.display = 'none'; // Hide loading indicator
      // Remove the attributes to prevent them from being seen in the inspector
      this.removeAttribute('endpoint');
      this.removeAttribute('searchAttribute');
      this.removeAttribute('stateThis');
    }
  }
}

// Define the custom element
customElements.define('async-tag', InjectorGenerator);
