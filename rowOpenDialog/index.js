/* Tue Oct 15 04:24:18 PM CST 2024
 * Sat Mar 29 02:14:57 PM CST 2025
 * Sun Apr 27 07:46:05 AM CST 2025
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
 * type: string; if set to "tooltip", always use dialog.show()
 *
 * EXAMPLES:
 * using the row search function to get searchAttributes
 *          <open-dialog closeButton="data-edit-close" class="cta font-small" openDialog="data-edit" searchAttributes='["equipo"]' buttonText="Editar"></open-dialog>
 * NOT passing params only open/close modal
 *          <open-dialog closeButton="data-invite-users-close" class="cta font-small" openDialog="data-invite-users" buttonText="Invitar a este equipo"></open-dialog>
 *
 */

class OpenDialog extends HTMLElement {
  constructor() {
    super();
    this.attachTemplate();
  }

  attachTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `<slot></slot>`;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');

    if (!slot) {
      console.error('[open-dialog] ❌ No <slot> found inside shadowRoot.');
      return;
    }


    const nodes = slot.assignedElements();

    if (!nodes.length) {
      console.warn('[open-dialog] ⚠️ No elements assigned yet. Listening for slotchange...');
      // Attach listener in case they come later
      slot.addEventListener('slotchange', () => {
        this.attachClickHandler(slot);
      });
      return;
    }

    // Elements are ready immediately
    this.attachClickHandler(slot);
  }

  attachClickHandler(slot) {
    const nodes = slot.assignedElements();

    if (!nodes.length) {
      console.error('[open-dialog] ❌ No slotted elements found when trying to attach click handler.');
      return;
    }

    const clickable = nodes[0];

    // Visual feedback (optional)
    clickable.style.cursor = 'pointer';

    clickable.addEventListener('click', () => {
      this.openDialog();
    });
  }

  elegant(dialog) {
    const windowSize = window.innerWidth;
    console.log(`[open-dialog] 🪟 Window size detected: ${windowSize}px`);
    if (windowSize < 768) {
      console.log('[open-dialog] 📱 Small screen, using showModal()');
      dialog.showModal();
    } else {
      console.log('[open-dialog] 🖥️ Large screen, using show()');
      dialog.show();
    }
  }

  openDialog() {

    const openDialogAttr = this.getAttribute('openDialog');
    const closeButtonAttr = this.getAttribute('closeButton');
    const isElegant = this.getAttribute('elegant') === 'true';
    const isTooltip = this.getAttribute('type') === 'tooltip';

    let searchAttributes;

    try {
      searchAttributes = JSON.parse(this.getAttribute('searchAttributes') || '[]');
    } catch (e) {
      console.error('[open-dialog] ❌ Invalid searchAttributes format:', e);
      return;
    }

    const dialog = document.querySelector(`[${openDialogAttr}]`);
    if (!dialog) {
      console.error('[open-dialog] ❌ Dialog not found.');
      return;
    }

    if (closeButtonAttr) {
      const closeButton = dialog.querySelector(`[${closeButtonAttr}]`);
      if (closeButton) {
        closeButton.addEventListener('click', () => this.closeDialogFunction(dialog));
      } else {
        console.error('[open-dialog] ❌ Close button not found.');
      }
    }

    if (!searchAttributes.length) {
      if (isTooltip) {
        dialog.show();
      } else if (isElegant) {
        this.elegant(dialog);
      } else {
        dialog.showModal();
      }
      return;
    }

    const editFieldsContainer = dialog.querySelector('[slot="edit-fields"]');
    const row = this.closest('tr');

    if (!editFieldsContainer || !row) {
      console.error('[open-dialog] ❌ Edit fields container or row not found.');
      return;
    }

    editFieldsContainer.innerHTML = '';

    const headers = Array.from(row.closest('table').querySelectorAll('th'))
      .map(th => th.textContent.trim().toLowerCase().replace(/\s+/g, '_'));

    searchAttributes.forEach(attr => {
      const normalizedAttr = attr.trim().toLowerCase().replace(/\s+/g, '_');

      const index = headers.indexOf(normalizedAttr);
      if (index !== -1) {
        const value = row.querySelector(`td:nth-child(${index + 1})`).textContent.trim();

        const fieldWrapper = document.createElement('label');
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
            <input type="text" id="${normalizedAttr}" name="${normalizedAttr}" value="${value}">
          `;
        }

        editFieldsContainer.appendChild(fieldWrapper);
      } else {
        console.warn(`[open-dialog] ⚠️ Attribute '${attr}' not found in table headers.`);
      }
    });

    // Finally open dialog
    if (isTooltip) {
      dialog.show();
    } else if (isElegant) {
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
