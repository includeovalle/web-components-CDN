/* Tue Oct 15 04:24:18 PM CST 2024
 * Sat Mar 29 02:04:26 PM CST 2025
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
 * elegant: string; if "true", chooses show() or showModal() depending on screen size
 *
 * EXAMPLES:
 * using the row search function to get searchAttributes
 *          <open-dialog closeButton="data-edit-close" class="cta font-small" openDialog="data-edit" searchAttributes='["equipo"]' buttonText="Editar"></open-dialog>
 * NOT passing params only open/close modal
 *          <open-dialog type="tooltip" elegant="true" closeButton="data-invite-users-close" class="cta font-small" openDialog="data-invite-users" buttonText="Invitar a este equipo"></open-dialog>
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
      template.innerHTML = `<button id="open-btn"></button>`;
      this.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    const button = this.querySelector('#open-btn');
    const buttonText = this.getAttribute('buttonText');
    // Get the user-defined classes from the `class` attribute of `open-dialog`
    const userClasses = this.getAttribute('class')?.split(' ') || [];
    const buttonContent = this.querySelectorAll('[slot="content"]');

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
        button.appendChild(slot);
      });
    }

    button.addEventListener('click', () => this.openDialog());
  }

  // Elegant logic to choose between show() and showModal() based on window size
  elegant(dialog) {
    const windowSize = window.innerWidth;
    if (windowSize < 768) {
      dialog.showModal();
    } else {
      dialog.show();
    }
  }

  openDialog() {
    const openDialogAttr = this.getAttribute('openDialog');
    const closeButtonAttr = this.getAttribute('closeButton');
    const isElegant = this.getAttribute('elegant') === 'true';

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

    // If no searchAttributes are passed, open the dialog immediately
    if (!searchAttributes.length) {
      if (isElegant) {
        this.elegant(dialog);
      } else {
        dialog.showModal();
      }
      return;
    }

    const editFieldsContainer = dialog.querySelector('[slot="edit-fields"]');
    const row = this.closest('tr');

    if (!editFieldsContainer || !row) {
      console.error('Edit fields container or row not found.');
      return;
    }

    editFieldsContainer.innerHTML = '';

    // Normalize headers by trimming whitespace, making lowercase, and replacing spaces with underscores
    const headers = Array.from(row.closest('table').querySelectorAll('th'))
      .map(th => th.textContent.trim().toLowerCase().replace(/\s+/g, '_'));

    searchAttributes.forEach(attr => {
      const normalizedAttr = attr.trim().toLowerCase().replace(/\s+/g, '_');
      console.log(`Attribute '${attr}' normalized to '${normalizedAttr}'`); // Log for debugging
      const index = headers.indexOf(normalizedAttr);

      if (index !== -1) {
        const value = row.querySelector(`td:nth-child(${index + 1})`).textContent.trim();
        const fieldWrapper = document.createElement('label');

        // Use the normalized attribute name for both label and input name
        const displayAttr = normalizedAttr.replace(/_/g, ' ');
        if (value === 'true' || value === 'false') {
          const isChecked = value === 'true';
          fieldWrapper.innerHTML = `
            ${displayAttr}: 
            <input type="checkbox" id="${normalizedAttr}" name="${normalizedAttr}" ${isChecked ? 'checked' : ''} value="${isChecked}">
          `;
          const checkbox = fieldWrapper.querySelector('input[type="checkbox"]');
          checkbox.addEventListener('change', () => {
            checkbox.value = checkbox.checked;
          });
        } else {
          fieldWrapper.innerHTML = `
            ${displayAttr}: 
            <input type="text" id=${normalizedAttr} name="${normalizedAttr}" value="${value}">
          `;
        }

        editFieldsContainer.appendChild(fieldWrapper);
      } else {
        console.warn(`Attribute "${attr}" not found in table headers.`);
      }
    });

    // Show dialog based on elegant or default behavior
    if (isElegant) {
      this.elegant(dialog);
    } else {
      dialog.showModal();
    }
  }

  closeDialogFunction(element) {
    element.close();
  }
}

customElements.define('open-dialog', OpenDialog);
