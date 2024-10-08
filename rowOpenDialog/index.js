/* Tue Oct  8 05:05:13 PM CST 2024
 *
 * FUNCTIONALITIES:
 * this web component creates a button
 * receibes a dialog
 * and populates the dialogs
 *
 * PARAMS:
 * openDialog: string; name of the dialog this will open
 * searchAttributes: array of strings; this contain the names of the table-fields this will populate into dialog
 * buttonText: string; The inner text of the button
 * class: strings user custom classes
 * closeButton: string; is a custom user data-styled-button for close the dialog
 *
 * EXAMPLES:
 * using the row search function to get searchAttributes
 *          <open-dialog closeButton="data-edit-close" class="cta font-small" openDialog="data-edit" searchAttributes='["equipo"]' buttonText="Editar"></open-dialog>
 * NOT passing params only open/close modal
            <open-dialog closeButton="data-invite-users-close" class="cta font-small" openDialog="data-invite-users" buttonText="Invitar a este equipo"></open-dialog>
 *
 */

class OpenDialog extends HTMLElement {
  constructor() {
    super();
    this.attachTemplate();
  }

  attachTemplate() {
    // Only attach the button if it's not already present
    if (!this.querySelector('#open-btn')) {
      const template = document.createElement('template');
      template.innerHTML = `
        <button id="open-btn"></button>
    `;
      this.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    const button = this.querySelector('#open-btn');
    const buttonText = this.getAttribute('buttonText') || 'Open Dialog';

    // Get the user-defined classes from the `class` attribute of `open-dialog`
    const userClasses = this.getAttribute('class')?.split(' ') || [];

    // Remove the class from the component itself so it doesn't affect it
    this.removeAttribute('class');

    // Set button text
    button.textContent = buttonText;

    // Apply any custom class names passed through the `class` attribute to the button
    if (userClasses.length) {
      button.classList.add(...userClasses);
    }

    button.addEventListener('click', () => this.openDialog());
  }

  openDialog() {
    const openDialogAttr = this.getAttribute('openDialog');
    const closeButtonAttr = this.getAttribute('closeButton');
    const searchAttributes = this.getAttribute('searchAttributes');
    const dialog = document.querySelector(`[${openDialogAttr}]`);

    if (!dialog) {
      console.error('Dialog not found.');
      return;
    }

    // If closeButton attribute is provided, find the button and attach the close event
    if (closeButtonAttr) {
      const closeButton = dialog.querySelector(`[${closeButtonAttr}]`);
      if (closeButton) {
        closeButton.addEventListener('click', () => this.closeDialogFunction(dialog));
      } else {
        console.error('Close button not found.');
      }
    }

    // If searchAttributes is not provided, open the dialog without populating
    if (!searchAttributes) {
      dialog.showModal();
      return;
    }

    const editFieldsContainer = dialog.querySelector('#edit-fields');
    const row = this.closest('tr');

    if (!editFieldsContainer || !row) {
      console.error('Edit fields container or row not found.');
      return;
    }

    // Clear previous content and populate the dialog if searchAttributes are provided
    editFieldsContainer.innerHTML = '';
    const attributesArray = JSON.parse(searchAttributes);
    const storedAttributes = {};

    // Get the table headers
    const headers = Array.from(row.closest('table').querySelectorAll('th')).map(th => th.textContent.trim());

    attributesArray.forEach(attr => {
      const index = headers.indexOf(attr); // Find the index of the attribute in headers
      if (index !== -1) {
        const value = row.querySelector(`td:nth-child(${index + 1})`).textContent || '';
        storedAttributes[attr] = value;

        // Dynamically create form fields based on the attributes
        const fieldWrapper = document.createElement('label');
        fieldWrapper.innerHTML = `
          ${attr}: 
          <input type="text" name="${attr}" id="${attr}" value="${value}">
        `;
        editFieldsContainer.appendChild(fieldWrapper);
      } else {
        console.warn(`Attribute "${attr}" not found in table headers.`);
      }
    });

    // Open the dialog after populating
    dialog.showModal();
  }

  closeDialogFunction(element) {
    element.close();
  }
}

customElements.define('open-dialog', OpenDialog);
