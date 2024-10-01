// <async-tag endpoint="/api/user" searchAttribute="user" storedData="localStore">
//   <strong slot="tag">user name</strong>
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
    const _data = this.getAttribute('storedData');

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

    // Show loading indicator
    const loadingElement = this.shadowRoot.querySelector('.loading');
    loadingElement.style.display = 'block';

    try {
      if (!endpoint) {
        console.error('No endpoint provided');
        return;
      }

      // Wait for 180ms before checking if data exists in window._data
      await new Promise(resolve => setTimeout(resolve, 180));

      // After 180ms, check if the data exists in window.localStore
      const storedData = window[_data] ? window[_data][endpoint] : null;

      if (storedData) {
        // If the data is available, use it
        assignedElement.textContent = storedData[attribute] || 'No data available'; // Update with the retrieved data
      } else {
        // If no stored data is available after 180ms, handle the case by either showing the initial content or fetching it
        assignedElement.textContent = initialContent || 'default missing endpoint attribute';

        // Here you can add your fetch logic to get the data from the endpoint
        // Example fetch logic (you can modify it as needed):
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Error fetching from ${endpoint}: ${response.statusText}`);
        }
        const data = await response.json();

        // Store the fetched data in window.localStore
        if (window[_data]) {
          window[_data][endpoint] = data; // Store data
        } else {
          window[_data] = { [endpoint]: data }; // Initialize storage
        }

        // Update the content with the fetched data
        assignedElement.textContent = data[attribute] || 'No data available'; // Update with the fetched data
      }
    } catch (error) {
      console.error('Error:', error);
      // If there's an error, the initial content remains
      assignedElement.textContent = initialContent;
    } finally {
      loadingElement.style.display = 'none'; // Hide loading indicator
    }
  }
}

// Define the custom element
customElements.define('async-tag', InjectorGenerator);





