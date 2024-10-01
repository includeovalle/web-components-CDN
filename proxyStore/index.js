class ProxyStore extends HTMLElement {
  constructor() {
    super();
    this.state = {}; // Holds the proxy object
    this.proxy = null;
    this.isProxyInitialized = false; // Flag to check if proxy has been initialized
    this.objectName = ''; // Store the object name
  }

  static get observedAttributes() {
    return ['endpoints', 'objectname'];
  }

  connectedCallback() {
    const endpoints = decodeURIComponent(this.getAttribute('endpoints'));
    this.objectName = this.getAttribute('objectname');

    if (this.objectName) {
      this.initializeProxy(this.objectName);
      // Dynamically expose the proxy on the window object using the objectName
      window[this.objectName] = this.proxy; 
    } else {
      console.error("[ProxyStore] 'objectname' attribute is missing.");
    }

    if (endpoints) {
      try {
        const endpointArray = JSON.parse(endpoints);
        this.fetchAndStoreEndpoints(endpointArray);
      } catch (error) {
        console.error(`[ProxyStore] Invalid endpoints format`, error);
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'endpoints' && oldValue !== newValue) {
      this.handleEndpointsChange(newValue);
    }
    if (name === 'objectname' && oldValue !== newValue) {
      this.updateProxyObjectName(newValue);
    }
  }

  initializeProxy(objectName) {
    if (!objectName) {
      console.error("[ProxyStore] 'objectname' is not valid.");
      return;
    }

    // Initialize the state and create a proxy
    if (!this.state[objectName]) {
      this.state[objectName] = {}; 
      this.proxy = new Proxy(this.state[objectName], {
        get: (target, prop) => {
          return prop in target ? target[prop] : null;
        },
        set: (target, prop, value) => {
          target[prop] = value;
          return true;
        }
      });
      this.isProxyInitialized = true;  // Mark proxy as initialized
    } else {
      console.log(`[ProxyStore] Proxy for '${objectName}' already initialized.`);
    }
  }

  updateProxyObjectName(newObjectName) {
    this.objectName = newObjectName;
    this.initializeProxy(newObjectName);
    // Update the exposed proxy in the window object
    window[newObjectName] = this.proxy; 
  }

  fetchAndStoreEndpoints(endpointArray) {
    if (!Array.isArray(endpointArray)) {
      console.error(`[ProxyStore] Invalid endpoints array.`);
      return;
    }

    // Make sure proxy is initialized before proceeding
    if (!this.isProxyInitialized) {
      console.warn(`[ProxyStore] Proxy is not initialized yet. Fetch postponed.`);
      return;
    }

    endpointArray.forEach(endpoint => {
      if (!endpoint || typeof endpoint !== 'string') {
        console.error(`[ProxyStore] Invalid endpoint value:`, endpoint);
        return;
      }

      // Check if the data is already cached in the Proxy
      if (this.proxy[endpoint]) {
        console.log(`[ProxyStore] Using cached data for: ${endpoint}`);
        return; // Skip fetch if data exists in Proxy
      }

      fetch(endpoint)
        .then(response => {
          if (!response.ok) {
            throw new Error(`[ProxyStore] Error fetching from ${endpoint}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(`${this.objectName} Storing data from ${endpoint}`);
          if (this.proxy) {
            this.proxy[endpoint] = data;
            console.log(`[ProxyStore] Retrieved data for ${endpoint}:`, data); // Log the retrieved data
          } else {
            console.error(`[ProxyStore] Proxy is not initialized.`);
          }
        })
        .catch(err => {
          console.error(`[ProxyStore] Error fetching from ${endpoint}:`, err);
        });
    });
  }

  handleEndpointsChange(newValue) {
    try {
      const newEndpoints = JSON.parse(newValue);
      console.log(`[ProxyStore] New endpoints received:`, newEndpoints);
      this.fetchAndStoreEndpoints(newEndpoints);
    } catch (err) {
      console.error(`[ProxyStore] Invalid endpoints format`, err);
    }
  }
}

customElements.define('proxy-store', ProxyStore);






