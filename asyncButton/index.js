// BUTTON overhaul
// Mon Oct 21 11:01:29 AM CST 2024
// Mon Apr 14 08:56:42 PM CST 2025
// Tue Apr 15 07:51:45 PM CST 2025
// Mié 07 may 2025 19:05:57 CST
// Dom 18 may 2025 20:32:35 CST
// Mié 21 may 2025 06:54:48 CST
// Lun 02 jun 2025 18:55:49 CST
//
// We register into this web-component the endpoints we are going to open on the page
// <post-listener endpoints='["/api/teams/accept", "/api/teams/control", "endpoint3...",]'></post-listener>
// so this webcomponent will search for buttons containing attribute 'endpoint'
// then will attach the post functionalities
//@params:
// success
// error
// ids
// href: string
// delay?: number
// closest?: string
// interactWithParams?: boolean envia la info del url
// --------USAGE-----------
// <button
// class="cta"
// interactWithParams="true" 
// success=" Información Validada ✅"
// ids='["password", "username"]'
// endpoint="/login"
// closest="form|tr|section|..."
//   href="/vision-general/" error="No se pudo iniciar session ❌">
//   Continuar</button>
//:

window.addEventListener('post-request', async (e) => {
  const { endpoint, payload, button } = e.detail;

  if (!endpoint || !button || button.requestInProgress) return;
  button.requestInProgress = true;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    const eventName = button.getAttribute('event');
    if (eventName) {
      const customEvent = new CustomEvent(eventName, {
        detail: json,
        bubbles: true,
      });
      button.dispatchEvent(customEvent);
    }
  } catch (err) {
    console.error('Request failed', err);
  } finally {
    button.requestInProgress = false;
  }
});

class PostListener extends HTMLElement {
  constructor() {
    super();
    this.endpoints = JSON.parse(this.getAttribute('endpoints') || '[]');
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  connectedCallback() {
    this.searchDomAndAttachListeners();

    const observer = new MutationObserver(() => {
      this.searchDomAndAttachListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  searchDomAndAttachListeners() {
    const elements = document.querySelectorAll('[endpoint]');
    elements.forEach((button) => {
      const endpoint = button.getAttribute('endpoint')?.trim();
      if (
        endpoint &&
        this.endpoints.map((e) => e.trim()).includes(endpoint) &&
        button.tagName.toLowerCase() === 'button'
      ) {
        const storedAttributes = {
          successText: button.getAttribute('success') || 'Success',
          errorText: button.getAttribute('error') || 'Error',
          ids: JSON.parse(button.getAttribute('ids') || '[]'),
          names: JSON.parse(button.getAttribute('names') || '[]'),
          href: button.getAttribute('href'),
          closestSelector: button.getAttribute('closest') || null,
          interactWithParams: button.getAttribute('interactWithParams') === 'true',
          originalText: button.textContent.trim(),
        };

        const scopeElement = storedAttributes.closestSelector
          ? button.closest(storedAttributes.closestSelector)
          : null;

        if (!scopeElement?.tagName.toLowerCase() === 'tr') {
          console.log('hmmmm', scopeElement);
          this.removeAttributes(button);
        }

        button.addEventListener('click', () =>
          this.handleButtonClick(button, endpoint, storedAttributes)
        );
      }
    });
  }

  disableButton(button) {
    button.disabled = true;
  }

  removeAttributes(button) {
    button.removeAttribute('endpoint');
    button.removeAttribute('ids');
    button.removeAttribute('href');
    button.removeAttribute('success');
    button.removeAttribute('error');
    button.removeAttribute('closest');
    button.removeAttribute('interactWithParams');
  }

  async handleButtonClick(button, endpoint, storedAttributes) {
    if (button.requestInProgress) return;
    button.requestInProgress = true;
    this.disableButton(button);

    const scopeElement = storedAttributes.closestSelector
      ? button.closest(storedAttributes.closestSelector)
      : null;

    const formData = {};
    storedAttributes.ids.forEach((id) => {
      const input = (scopeElement || document).querySelector(`#${id}`);
      if (!input) return;

      if (input.type === 'checkbox') {
        if (input.checked) {
          formData[input.id] = true;
        }
      } else {
        formData[input.id] = input.value;
      }
    });

    // Include URL params if interactWithParams is true
    if (storedAttributes.interactWithParams) {
      const urlParams = new URLSearchParams(window.location.search);
      for (const [key, value] of urlParams.entries()) {
        formData[key] = value;
      }
    }

    const event = new CustomEvent('post-request', {
      detail: {
        endpoint,
        payload: formData,
        button,
      },
      bubbles: true,
    });

    button.dispatchEvent(event);

    if (
      scopeElement &&
      scopeElement.tagName.toLowerCase() === 'form' &&
      !scopeElement.checkValidity()
    ) {
      scopeElement.reportValidity();
      button.disabled = false;
      button.requestInProgress = false;
      return;
    }

    const delay = parseInt(button.getAttribute('delay'), 10);
    const useDelay = !isNaN(delay);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(formData).length ? JSON.stringify(formData) : null,
      });

      if (response.ok) {
        button.textContent = storedAttributes.successText;

        const resetOrRedirect = () => {
          if (storedAttributes.href) {
            window.location.href = storedAttributes.href;
          } else if (scopeElement?.tagName.toLowerCase() === 'form') {
            scopeElement.reset?.();
          }
        };

        useDelay ? setTimeout(resetOrRedirect, delay) : resetOrRedirect();
      } else {
        button.textContent = storedAttributes.errorText;
        if (scopeElement?.tagName.toLowerCase() === 'form') {
          scopeElement.reset?.();
        }
      }
    } catch (err) {
      console.error('[handleButtonClick] Fetch failed:', err);
      button.textContent = storedAttributes.errorText;
    } finally {
      const restore = () => {
        button.textContent = storedAttributes.originalText;
        button.disabled = false;
        button.requestInProgress = false;
      };
      useDelay ? setTimeout(restore, delay) : restore();
    }
  }
}

customElements.define('post-listener', PostListener);
