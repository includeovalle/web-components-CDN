
/*
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
 *
        <open-dialog 
          class="cta font-small" 
          openDialog="data-edit"
          searchAttributes='["id", "fecha", "compra", "cantidad", "costo", "lugar", "notas"]'
          buttonText="Editar"
        >
        </open-dialog>

          <open-dialog class="cta font-small" openDialog="data-delete" searchAttributes='["id"]' buttonText="Borrar"></open-dialog>
 *
 */

class OpenDialog extends HTMLElement {
  constructor() {
    super();
    this.attachTemplate();
  }

  attachTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
        <button id="open-btn"></button>
      `;

    // Append the template content to the component
    this.appendChild(template.content.cloneNode(true));
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
    const searchAttributes = JSON.parse(this.getAttribute('searchAttributes'));
    const dialog = document.querySelector(`[${openDialogAttr}]`);
    const row = this.closest('tr');
    const editFieldsContainer = dialog.querySelector('#edit-fields');

    if (!dialog || !editFieldsContainer || !row) {
      console.error('Dialog, edit fields container, or row not found.');
      return;
    }

    // Clear previous content
    editFieldsContainer.innerHTML = '';

    // Create an object to store passed attributes and their values
    const storedAttributes = {};

    searchAttributes.forEach((attr, index) => {
      const value = row.querySelector(`td:nth-child(${index + 1})`).textContent || '';
      storedAttributes[attr] = value; // Store attribute and value in the object

      // Dynamically create form fields based on the attributes
      const fieldWrapper = document.createElement('label');
      fieldWrapper.innerHTML = `
          ${attr}: 
          <input type="text" name="${attr}" id="${attr}" value="${value}">
        `;
      editFieldsContainer.appendChild(fieldWrapper);
    });

    // Log the `storedAttributes` object for debugging purposes or future use
    // console.log('Stored Attributes:', storedAttributes);

    // Open the dialog
    dialog.showModal();
  }
}

customElements.define('open-dialog', OpenDialog);
