/*
  * @params:
  *   endpoints:  Representa un arreglo con los endpoints que va a traer el componente
  *   objectName: Representa el nombre del proxy donde se almacenara la informacion obtenida
  *   cache?: [true] Representa si queremos que el proxy se almacene en el session-storage del navegador.
  *   Si se almacena crea un utiliza objectName para guardar la informacion permitiendo su persistencia en la ventana.
  *   Si no se incluye cache="true" hara una llamada al endpoint encada refresco de la pagina, o navegacion dentro de la app
  *
    <proxy-store endpoints='["/api/user/info"]' 
    objectname="nombre_del_proxy"
    cache="true" 
    >
    </proxy-store>
  */

class ProxyStore extends HTMLElement {
  constructor() {
    super();
    this.rawData = {};
    this.proxy = null;
    this.isProxyInitialized = false;
    this.objectName = '';
    this.useCache = false;
  }

  static get observedAttributes() {
    return ['endpoints', 'objectname', 'cache'];
  }

  connectedCallback() {
    const endpoints = decodeURIComponent(this.getAttribute('endpoints') || '');
    this.objectName = this.getAttribute('objectname');
    this.useCache = this.getAttribute('cache') === 'true';

    if (!this.objectName) {
      console.error("[ProxyStore] 'objectname' attribute is missing.");
      return;
    }

    this.removeAttribute('endpoints');

    console.log(`[ProxyStore] Initializing "${this.objectName}" (cache=${this.useCache})`);

    if (this.useCache) {
      const sessionData = sessionStorage.getItem(this.objectName);
      if (sessionData) {
        try {
          this.rawData = JSON.parse(sessionData);
          console.log(`[ProxyStore] Restored from sessionStorage:`);
        } catch (err) {
          console.warn(`[ProxyStore] Failed to parse sessionStorage`, err);
          this.rawData = {};
        }
      } else {
        console.log(`[ProxyStore] No cache found`);
        this.rawData = {};
      }
    } else {
      this.rawData = {};
    }

    this.proxy = new Proxy(this.rawData, {
      get: (target, prop) => {
        const value = prop in target ? target[prop] : null;
        return value;
      },
      set: (target, prop, value) => {
        target[prop] = value;
        if (this.useCache) this.syncSessionStorage();
        return true;
      }
    });

    window[this.objectName] = this.proxy;
    this.isProxyInitialized = true;

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
    if (name === 'cache') {
      this.useCache = newValue === 'true';
    }
  }

  updateProxyObjectName(newObjectName) {
    this.objectName = newObjectName;
    const sessionData = this.useCache ? sessionStorage.getItem(newObjectName) : null;
    this.rawData = sessionData ? JSON.parse(sessionData) : {};
    this.proxy = new Proxy(this.rawData, {
      get: (target, prop) => (prop in target ? target[prop] : null),
      set: (target, prop, value) => {
        target[prop] = value;
        if (this.useCache) this.syncSessionStorage();
        return true;
      }
    });
    this.isProxyInitialized = true;
    window[newObjectName] = this.proxy;
  }

  fetchAndStoreEndpoints(endpointArray) {
    if (!Array.isArray(endpointArray)) {
      console.error(`[ProxyStore] Invalid endpoints array.`);
      return;
    }

    if (!this.isProxyInitialized) {
      console.warn(`[ProxyStore] Proxy is not initialized yet. Fetch postponed.`);
      return;
    }

    endpointArray.forEach(endpoint => {
      if (!endpoint || typeof endpoint !== 'string') {
        console.error(`[ProxyStore] Invalid endpoint:`, endpoint);
        return;
      }

      if (this.rawData[endpoint]) {
        console.log(`[ProxyStore] Cache hit for "${endpoint}"`);
        return;
      }

      console.log(`[ProxyStore] Fetching`);
      fetch(endpoint)
        .then(response => {
          if (!response.ok) {
            throw new Error(`[ProxyStore] Error fetching "${endpoint}": ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          this.proxy[endpoint] = data;
        })
        .catch(err => {
          console.error(`[ProxyStore] Fetch error for "${endpoint}":`, err);
        });
    });
  }

  handleEndpointsChange(newValue) {
    try {
      const newEndpoints = JSON.parse(newValue);
      this.fetchAndStoreEndpoints(newEndpoints);
    } catch (err) {
      console.error(`[ProxyStore] Invalid endpoints format`, err);
    }
  }

  syncSessionStorage() {
    try {
      const serialized = JSON.stringify(this.rawData);
      sessionStorage.setItem(this.objectName, serialized);
      console.log(`[ProxyStore] sessionStorage updated for "${this.objectName}"`);
    } catch (err) {
      console.warn(`[ProxyStore] Could not sync sessionStorage`, err);
    }
  }
}

customElements.define('proxy-store', ProxyStore);
