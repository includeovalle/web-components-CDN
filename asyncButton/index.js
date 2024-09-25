// ids
// Type: string
// Description: A comma-separated list of IDs of input elements.
// such elements must posses a NAME
// The values of these NAME's will be collected and sent in the POST request.
// Example: <async-button ids="username,password"></async-button>

// endpoint
// Type: string
// Description: The URL to which the POST request will be sent.
// Example: <async-button endpoint="https://example.com/api/login"></async-button>

// href
// Type: string
// Description: The URL to redirect to upon successful POST request. If the POST request fails, the page will reload.
// Example: <async-button href="https://example.com/dashboard"></async-button>

// loading
// Type: string (optional)
// Description: The text to display on the button while the POST request is in progress. Defaults to "loading" if not provided.
// Example: <async-button loading="Submitting..."></async-button>

// class
// Type: string (optional)
// Description: Any custom CSS classes to apply to the button element within the component.
// Example: <async-button class="primary-button"></async-button>

//Example of use:
// <async-button class="cta" loading="Registrado, bienvenido" ids="password1,username1" error="No se pudo registrar"  endpoint="/register" href="/">Registrarme</async-button>



class AsyncButton extends HTMLElement {
    constructor() {
        super();
        this.storedAttributes = {};
    }

    connectedCallback() {
        this.storeAttributes();
        this.render();
        this.addEventListeners();
        this.removeAttributes(); // Remove attributes after rendering
    }

    storeAttributes() {
        this.storedAttributes.ids = this.getAttribute('ids')?.split(',') || [];
        this.storedAttributes.endpoint = this.getAttribute('endpoint');
        this.storedAttributes.href = this.getAttribute('href');
        this.storedAttributes.loadingText = this.getAttribute('loading') || 'loading';
        this.storedAttributes.errorText = this.getAttribute('error') || 'something went wrong';
        this.storedAttributes.buttonClass = this.getAttribute('class') || '';
        this.storedAttributes.innerText = this.textContent.trim(); // Store the initial button text
    }

    disableButton() {
        this.querySelector('button').disabled = true;
    }

    validateForm() {
        return this.storedAttributes.ids.every(id => {
            const element = document.getElementById(id);
            if (element) {
                return element.reportValidity();
            }
            return false;
        });
    }

    async handleClick() {
        if (this.storedAttributes.ids.length > 0 && !this.validateForm()) {
            return; // Exit if the form is not valid
        }

        const button = this.querySelector('button');
        button.textContent = this.storedAttributes.loadingText;

        this.disableButton();

        let formData = null;
        if (this.storedAttributes.ids.length > 0) {
            formData = {};
            this.storedAttributes.ids.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    formData[element.name] = element.value;
                }
            });
        }

        try {
            const response = await fetch(this.storedAttributes.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: formData ? JSON.stringify(formData) : null,
            });

            if (response.ok) {
                setTimeout(() => {
                    window.location.href = this.storedAttributes.href;
                }, 1600); // 2-second delay
            } else {
                button.textContent = this.storedAttributes.errorText;
            }
        } catch (error) {
            button.textContent = this.storedAttributes.errorText;
        } finally {
            setTimeout(() => {
                button.textContent = this.storedAttributes.innerText; // Restore initial text
                button.disabled = false;
            }, 1600); // Restore button state after 2 seconds
        }
    }

    addEventListeners() {
        this.querySelector('button').addEventListener('click', () => this.handleClick());
    }

    render() {
        this.innerHTML = `
            <button class="${this.storedAttributes.buttonClass}">
                ${this.storedAttributes.innerText}
            </button>
        `;
    }

    removeAttributes() {
        this.removeAttribute('endpoint');
        this.removeAttribute('ids');
        this.removeAttribute('href');
        this.removeAttribute('loading');
        this.removeAttribute('class');
        this.removeAttribute('error');
    }
}

customElements.define('async-button', AsyncButton);
