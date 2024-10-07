// This component receibes a localStore, and enpoint  checks for info,
// if nothing comes doesn'nt render anything, If shows displays slot tag
//
// USAGE:
// <async-if endpoint="/api/teams"  storedData="localStore" searchAttribute="teams">
//   <h2 slot="tag"> Los equipos a los que perteneces</h2>
// </async-if>

class AsyncIf extends HTMLElement {
  constructor() {
    super();
    // Template is defined but not attached yet
    this.template = document.createElement('template');
    this.template.innerHTML = ` <slot name="tag" style="display: none"></slot> `;
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

      // Wait before checking if data exists in window._data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if data exists in window.localStore
      const storedData = window[_data] ? window[_data][endpoint] : null;

      let data;

      if (storedData) {
        // Use stored data if available
        data = storedData;
      } else {
        // Fetch data from the endpoint if not available in local storage
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Error fetching from ${endpoint}: ${response.statusText}`);
        }
        data = await response.json();

        // Store the fetched data in window.localStore
        if (window[_data]) {
          window[_data][endpoint] = data; // Store data
        } else {
          window[_data] = { [endpoint]: data }; // Initialize storage
        }
      }

      // Check if the data for the specified attribute is an empty array
      if (Array.isArray(data[attribute]) && data[attribute].length === 0) {
        console.warn(`No data available for ${attribute}, removing component from DOM.`);
        this.remove(); // Remove the component from the DOM
      } else {
        // Only append the template if the condition is satisfied
        this.appendChild(this.template.content.cloneNode(true));

        // Show the slot content
        const slotElement = this.querySelector('slot[name="tag"]');
        const assignedElements = slotElement.assignedNodes();
        const assignedElement = assignedElements.length > 0 ? assignedElements[0] : null;
        if (assignedElement) {
          assignedElement.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error:', error);
      this.remove(); // Remove this component from the DOM on error
    }
  }
}

// Define the custom element
customElements.define('async-if', AsyncIf);
