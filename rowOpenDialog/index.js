/* Wed Oct  9 10:08:56 PM CST 2024
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
    let searchAttributes;

    try {
      searchAttributes = JSON.parse(this.getAttribute('searchAttributes') || '[]');
    } catch (e) {
      console.error('Invalid searchAttributes format:', e);
      return;
    }

    const dialog = document.querySelector(`[${openDialogAttr}]`);
    if (!dialog) {
      console.error('Dialog not found.');
      return;
    }

    if (closeButtonAttr) {
      const closeButton = dialog.querySelector(`[${closeButtonAttr}]`);
      if (closeButton) {
        closeButton.addEventListener('click', () => this.closeDialogFunction(dialog));
      } else {
        console.error('Close button not found.');
      }
    }

    if (!searchAttributes.length) {
      dialog.showModal();
      return;
    }

    const editFieldsContainer = dialog.querySelector('[slot="edit-fields"]');
    const row = this.closest('tr');

    if (!editFieldsContainer || !row) {
      console.error('Edit fields container or row not found.');
      return;
    }

    editFieldsContainer.innerHTML = '';
    // Normalize headers by trimming whitespace and making lowercase
    const headers = Array.from(row.closest('table').querySelectorAll('th'))
      .map(th => th.textContent.trim().toLowerCase());

    searchAttributes.forEach(attr => {
      const normalizedAttr = attr.trim().toLowerCase();
      const index = headers.indexOf(normalizedAttr);

      if (index !== -1) {
        const value = row.querySelector(`td:nth-child(${index + 1})`).textContent.trim();
        const fieldWrapper = document.createElement('label');

        if (value === 'true' || value === 'false') {
          const isChecked = value === 'true';
          fieldWrapper.innerHTML = `
          ${attr}: 
          <input type="checkbox" name="${attr}" id="${attr}" ${isChecked ? 'checked' : ''} value="${isChecked}">
        `;
          const checkbox = fieldWrapper.querySelector('input[type="checkbox"]');
          checkbox.addEventListener('change', () => {
            checkbox.value = checkbox.checked;
          });
        } else {
          fieldWrapper.innerHTML = `
          ${attr}: 
          <input type="text" name="${attr}" id="${attr}" value="${value}">
        `;
        }
        editFieldsContainer.appendChild(fieldWrapper);
      } else {
        console.warn(`Attribute "${attr}" not found in table headers.`);
      }
    });

    dialog.showModal();
  }

  closeDialogFunction(element) {
    element.close();
  }
}

customElements.define('open-dialog', OpenDialog);
