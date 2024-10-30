/* Tue Oct 29 05:52:43 PM CST 2024
 *
 * FUNCTIONALITIES:
 * this web component creates a button
 * identifies button current row and send searchAttributes to backend 
 *
 * PARAMS:
 * searchAttributes: array of strings; this contain the names of the table-fields this will populate request
 * buttonText: string; The inner text of the button
 * class: strings user custom classes
 * endpoint: a string with the endpoint to make the post
 * error: string displayed within button if something goes wrong
 * if we passs a button should add id="sender"
 *
 * EXAMPLES:
            <row-post class="cta" searchAttributes='["equipo","aceptado"]'>
              <button id="sender" endpoint="/api/teams/accept" error="No se pudo unir">
                Aceptar
              </button>
            </row-post>
 *
 * or
 *
            <row-post class="cta" searchAttributes='["equipo","aceptado"]' endpoint="/api/teams/accept" error="No se pudo unir" buttonText>
               >
            </row-post>
 */

class RowPost extends HTMLElement {
  constructor() {
    super();
    this.attachTemplate();
  }

  attachTemplate() {
    // Only attach the button if it's not already present
    if (!this.querySelector('#sender')) {
      const template = document.createElement('template');
      template.innerHTML = `
        <button id="sender"></button>
    `;
      this.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    const button = this.querySelector('#sender');
    const buttonText = this.getAttribute('buttonText');
    const userClasses = this.getAttribute('class')?.split(' ') || [];
    const buttonContent = this.querySelectorAll('[slot="content"]');
    let errorText = button.getAttribute('error');
    let endpoint = button.getAttribute('endpoint');
    let searchAttributes;

    try {
      searchAttributes = JSON.parse(this.getAttribute('searchAttributes') || '[]');
    } catch (e) {
      console.error('Invalid searchAttributes format:', e);
      return;
    }

    if (!endpoint) {
      endpoint = this.getAttribute('endpoint')
    }

    if (!errorText) {
      errorText = this.getAttribute('error');
    }

    if (!endpoint) {
      console.error( 'no endpoint provided')
    } 

    try{
      errorText = errorText.trim()
    } catch  (error) {console.error( 'no errorText provided',error )}

    // Remove the class from the component itself so it doesn't affect it
    this.removeAttribute('class');

    // Apply any custom class names passed through the `class` attribute to the button
    if (userClasses.length) {
      button.classList.add(...userClasses);
    }

    // Set button content based on buttonText or existing child nodes
    if (buttonText) {
      button.textContent = buttonText;
    } else {
      // Move existing child nodes to the button if no buttonText is provided
      buttonContent.forEach(slot => {
        button.appendChild(slot)
      })
    }

    let data = {}

    const row = button.closest('tr');
    const table = row?.closest('table');

    // Normalize headers by trimming whitespace, making lowercase, and replacing spaces with underscores
    const headers = Array.from(table.querySelectorAll('th'))
      .map(th => th.textContent.trim().toLowerCase().replace(/\s+/g, '_'));

    searchAttributes.forEach(attr => {
      const normalizedAttr = attr.trim().toLowerCase().replace(/\s+/g, '_');
      const index = headers.indexOf(normalizedAttr);

      if (index !== -1) {  // Only proceed if the header is found
        const value = row.querySelector(`td:nth-child(${index + 1})`)?.textContent.trim();
        data[normalizedAttr]= value ;
      }
    });

    button.addEventListener('click', () => this.handleButtonClick(button, endpoint, data, errorText));
  }

  async handleButtonClick(button, endpoint, data,  errorText ) {
    const originalText = button.innerText
    data["aceptado"]= true
    button.disabled = true;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const row = button.closest('tr');

        setTimeout(() => {
          row.remove()
        }, 1600);
      } else {
        button.textContent = errorText;
      }
    } catch (error) {
      console.error("Error occurred during fetch:", error);
      button.textContent = errorText;
    } finally {
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1600);
    }
  }
  }


customElements.define('row-post', RowPost);
