// BUTTON overhaul 
// Mon Oct 21 11:01:29 AM CST 2024
// Mon Apr 14 08:56:42 PM CST 2025
// Tue Apr 15 07:51:45 PM CST 2025
// Mié 07 may 2025 19:05:57 CST
// instead of previous behavior which was to insert web component each time we need a post button
// NOW: we register into this web-component the endpoints we are going to open on the page
// <post-listener endpoints='["/api/teams/accept", "/api/teams/control", "endpoint3...",]'></post-listener>
// so this webcomponent will search for buttons containing attribute 'endpoint'
// then will attach the post functionalities
//@params:
// success
// error
// ids
// href: string
// delay?: number
// --------USAGE-----------
// <button 
// class="cta" 
// success=" Información Validada ✅" 
// ids='["password", "username"]' 
// endpoint="/login"
//   href="/vision-general/" error="No se pudo iniciar session ❌">
//   Continuar</button>
//:

class PostListener extends HTMLElement {
  constructor() {
    super();
    this.endpoints = JSON.parse(this.getAttribute('endpoints') || '[]');
  }

  connectedCallback() {
    document.addEventListener('DOMContentLoaded', () => {
      this.searchDomAndAttachListeners();
    });
  }

  searchDomAndAttachListeners() {
    const elements = document.querySelectorAll('[endpoint]');
    elements.forEach(button => {
      const endpoint = button.getAttribute('endpoint')?.trim();
      if (
        endpoint &&
        this.endpoints.map(e => e.trim()).includes(endpoint) &&
        button.tagName.toLowerCase() === 'button'
      ) {
        const storedAttributes = {
          successText: button.getAttribute('success') || 'Success',
          errorText: button.getAttribute('error') || 'Error',
          ids: JSON.parse(button.getAttribute('ids') || '[]'),
          names: JSON.parse(button.getAttribute('names') || '[]'),
          href: button.getAttribute('href'),
          originalText: button.textContent.trim()
        };

        this.removeAttributes(button);
        button.addEventListener('click', () =>
          this.handleButtonClick(button, endpoint, storedAttributes)
        );
      }
    });
  }

  async handleButtonClick(button, endpoint, storedAttributes) {
    if (button.requestInProgress) return;
    button.requestInProgress = true;
    this.disableButton(button);

    const form = button.closest('form');
    const formData = {};

    storedAttributes.ids.forEach(id => {
      const input = form?.querySelector(`#${id}`);
      if (input) {
        formData[input.id] = input.value;
      }
    });

    if (form && !form.checkValidity()) {
      form.reportValidity();
      button.requestInProgress = false;
      button.disabled = false;
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
        if (useDelay) {
          setTimeout(() => {
            storedAttributes.href
              ? (window.location.href = storedAttributes.href)
              : form?.reset();
          }, delay);
        } else {
          storedAttributes.href
            ? (window.location.href = storedAttributes.href)
            : form?.reset();
        }
      } else {
        button.textContent = storedAttributes.errorText;
        form?.reset();
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      button.textContent = storedAttributes.errorText;
    } finally {
      if (useDelay) {
        setTimeout(() => {
          button.textContent = storedAttributes.originalText;
          button.disabled = false;
          button.requestInProgress = false;
        }, delay);
      } else {
        button.textContent = storedAttributes.originalText;
        button.disabled = false;
        button.requestInProgress = false;
      }
    }
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
  }
}

customElements.define('post-listener', PostListener);

