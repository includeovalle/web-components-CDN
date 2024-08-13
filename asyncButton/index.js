
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

class AsyncButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.storedAttributes = {};

        // Create and apply stylesheet
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(`
            .cta {
                font-size: 1.4em;
                color: var(--silver);
                border-radius: var(--default-border-radius);
            background-color: transparent;
                cursor:pointer;
                padding: var(--default-padding-inset);
            }
            .cta:hover {
                color: var(--primary-light);
                background-color: var(--silver-tint);
            }
            /* Add your styles here */
        `);
        this.shadowRoot.adoptedStyleSheets = [stylesheet];
    }

    connectedCallback() {
        this.storeAttributes();
        this.removeAttributes();
        this.render();
        this.addEventListeners();
    }

    storeAttributes() {
        this.storedAttributes.ids = this.getAttribute('ids')?.split(',') || [];
        this.storedAttributes.endpoint = this.getAttribute('endpoint');
        this.storedAttributes.href = this.getAttribute('href');
        this.storedAttributes.loadingText = this.getAttribute('loading') || 'loading';
        this.storedAttributes.buttonClass = this.getAttribute('class') || '';
    }

    disableButton() {
        this.shadowRoot.querySelector('button').disabled = true;
    }

    validateForm() {
        return this.storedAttributes.ids.every(id => {
            const element = document.getElementById(id);
            if (element) {
                return element.reportValidity();
            }
            return true;
        });
    }

    async handleClick() {
        if (!this.validateForm()) {
            return; // Exit if the form is not valid
        }

        const button = this.shadowRoot.querySelector('button');
        const originalText = button.textContent;
        button.textContent = this.storedAttributes.loadingText;

        this.disableButton();
        const formData = {};
        this.storedAttributes.ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                formData[element.name] = element.value;
            }
        });

        try {
            const response = await fetch(this.storedAttributes.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            setTimeout(() => {
                if (response.ok) {
                    window.location.href = this.storedAttributes.href;
                } else {
                    window.location.reload();
                }
            }, 1900); // 2-second delay
        } catch (error) {
            console.error('Error:', error);
            setTimeout(() => {
                window.location.reload();
            }, 1900); // 2-second delay
        } finally {
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 1900); // Restore button state after 2 seconds
        }
    }

    addEventListeners() {
        this.shadowRoot.querySelector('button').addEventListener('click', () => this.handleClick());
    }

    render() {
        const template = document.createElement('template');
        template.innerHTML = `
            <button class="${this.storedAttributes.buttonClass}">
                <slot></slot>
            </button>
        `;

        // Append content to shadow DOM
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    removeAttributes() {
        this.removeAttribute('endpoint');
        this.removeAttribute('ids');
        this.removeAttribute('href');
        this.removeAttribute('loading');
        this.removeAttribute('class');
    }
}

customElements.define('async-button', AsyncButton);
