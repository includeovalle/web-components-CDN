// ATTRIBUTES: 
// endpoint : string; points the endpoint to get data
// searchAttribute: "/data"; represents the attribute we are getting from endpoint
// editEndpoint: string; is the enpoint to make changes to a record
// editButtonText: string; is the text that will be shown in the button editEndpoint.
// deleteEndpoint: string; is endpoint to delete a record
// deleteButtonText: string; is the text that will be shown in the button deleteEndpoint. 
// cancelButtonText: string; is the text for the cancel button when editing a record
// hideFromView: [item1,item2,item3]; array of strings which contains columns to hide
// className: this isn't a shadow dom component so we can use userss custom className
// storedData: string; this is a Proxy state created by user will be accesed by window[storedData] 


/* FUCTIONALITIES:
  *
  * Sort when clicked on headers
  * edit record when editButtonText, cancelButtonText and deleteButtonText are passed.
  * if storedData is passed this will fetch from custom Proxy state
  * if storedData is NOT passed this will fetch from localhost/api API
  * fallback to slot name="tag" if anything goes wrong
  */

/*USE EXAMPLES:
  *
  * Full_editable:
      <async-table
          class="custom--table wide-inset-padding"
          endpoint="/api/data"
          hideFromView="id,usuario"
          searchAttribute="data"
          editEndpoint="/api/update"
          deleteEndpoint="/api/delete"
          cancelButtonText="Cancelar"
          editButtonText="Actualizar ✅"
          deleteButtonText="❌ BORRAR registro ❌"
          storedData="localStore"
        >
        <p slot="tag"> No has registrado nada</p>
      </async-table>
  *
  *
  * Content_show:
        <async-table endpoint="/api/teams" searchAttribute="teams" storedData="localStore" hideFromView="id">
          <p slot="tag">Actualmente no tienes equipos.</p>
          <h3 slot="tag"> Crea un equipo: </h3>
          <br slot="tag">
          <button slot="tag" class="cta" data-modal>CREA TU EQUIPO</button>
        </async-table>
  *
  */

class AsyncTable extends HTMLElement {
  constructor() {
    super();
    this.sortState = {};
    this.currentRowData = null; // Store the row data being edited
  }

async connectedCallback() {
  // Store the attribute values in storedComponents
  this.storedComponents = {
    className: this.getAttribute('class') || '',
    endpoint: this.getAttribute('endpoint'),
    hideFromView: this.getAttribute('hideFromView'),
    searchAttribute: this.getAttribute('searchAttribute'),
    editEndpoint: this.getAttribute('editEndpoint'),
    deleteEndpoint: this.getAttribute('deleteEndpoint'),
    deleteButtonText: this.getAttribute('deleteButtonText'),
    editButtonText: this.getAttribute('editButtonText'),
    cancelButtonText: this.getAttribute('cancelButtonText'),
    storedData: this.getAttribute('storedData')
  };

  let data = null;

  // Wait for 200ms before checking for the state in window[storedData]
  await new Promise(resolve => setTimeout(resolve, 200));

  // Check if storedData exists in window
  if (this.storedComponents.storedData && window[this.storedComponents.storedData]) {
    // Extract the data from Proxy
    const proxyData = window[this.storedComponents.storedData];
    data = proxyData[this.storedComponents.endpoint]?.[this.storedComponents.searchAttribute] || [];
    // console.log('Data loaded from window:', data);
  }

  // If no data is found in window[storedData], fetch it from the API
  if (!data ) {
    try {
      const response = await fetch(this.storedComponents.endpoint);
      const fetchedData = await response.json();
      data = fetchedData[this.storedComponents.searchAttribute] || [];
      // console.log('Data fetched from API:', data);

      // Optionally, store fetched data in window for future use
      window[this.storedComponents.storedData] = fetchedData; // Store the entire response
    } catch (error) {
      console.error('Failed to fetch data from API:', error);
      return; // Exit if fetch fails
    }
  }

  // Ensure data is an array or at least not empty
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('Data endpoint is empty. Showing slot content.');
    return; // Do not proceed to render the table if data is empty or invalid
  }

  // Proceed to store rows and hidden columns after obtaining data
  this.rows = data;
  this.hiddenColumns = this.getHiddenColumns(this.storedComponents.hideFromView);

  // Render the table
  this.renderTable({
    className: this.storedComponents.className,
    deleteButtonText: this.storedComponents.deleteButtonText,
    editButtonText: this.storedComponents.editButtonText,
    cancelButtonText: this.storedComponents.cancelButtonText
  });
}

  renderTable({ className, cancelButtonText, editButtonText, deleteButtonText }) {
    const template = document.createElement('template');
    template.innerHTML = `
      <slot name="tag"></slot>
      <table class="${className}">
        <thead>
          <tr id="header-row"></tr>
        </thead>
        <tbody id="body-rows"></tbody>
      </table>

      <!-- Dialog Modal for Editing Row -->
      <dialog id="edit-dialog">
        <form method="dialog">
            <h3>Editar producto:</h3>
          <div id="edit-fields"></div>
          <menu>
            <button id="cancel-btn">${cancelButtonText}</button>
            <button id="save-btn" type="submit">${editButtonText}</button>
          </menu>
          <menu>
            <button id="delete-btn" type="button">${deleteButtonText}</button>
          </menu>
        </form>
      </dialog>
    `;

    const tableClone = template.content.cloneNode(true);
    const headerRow = tableClone.querySelector('#header-row');
    const tbody = tableClone.querySelector('#body-rows');

    const headers = Object.keys(this.rows[0] || {});

    // Create the header row
    headers.forEach(header => {
      if (!this.hiddenColumns.includes(header)) {
        const th = document.createElement('th');
        th.textContent = header;

        // Add click event for sorting

        th.addEventListener('click', () => this.sortTable(header));

        headerRow.appendChild(th);
      }
    });

    // Populate the table body
    this.renderRows(tbody, this.rows, this.hiddenColumns);

    // Clear previous content and append new table
    this.innerHTML = ''; // Clear existing content
    this.appendChild(tableClone); // Append the table

    // Set up event listeners for dialog actions
    this.setupDialogListeners();
  }

renderRows(tbody, dataArray, hiddenColumns) {
  tbody.innerHTML = ''; // Clear existing rows
  
  const { deleteButtonText, editButtonText, cancelButtonText } = this.storedComponents;

  // Check if the buttons are set to determine if editing functionality should be added
  const shouldEnableEdit = deleteButtonText && editButtonText && cancelButtonText;

  dataArray.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    
    Object.keys(row).forEach(header => {
      if (!hiddenColumns.includes(header)) {
        const td = document.createElement('td');
        td.textContent = row[header];
        tr.appendChild(td);
      }
    });

    // Conditionally add onclick event to open dialog for editing the clicked row
    if (shouldEnableEdit) {
      tr.addEventListener('click', () => this.openEditDialog(row, rowIndex));
    }

    tbody.appendChild(tr);
  });
}

  // Open the dialog to edit the selected row
  openEditDialog(rowData, rowIndex) {
    this.currentRowData = { ...rowData }; // Clone the row data
    const dialog = this.querySelector('#edit-dialog');
    const editFieldsContainer = this.querySelector('#edit-fields');

    // Clear previous fields
    editFieldsContainer.innerHTML = '';

    // Dynamically create input fields for each row item
    Object.keys(rowData).forEach(key => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.innerHTML = `
        <label>${key}</label>
        <input type="text" name="${key}" value="${rowData[key]}">
      `;
      editFieldsContainer.appendChild(fieldWrapper);
    });

    // Show the dialog
    dialog.showModal();

    // Set a custom attribute to track the row being edited
    dialog.setAttribute('data-row-index', rowIndex);
  }

  // Setup event listeners for dialog actions
  setupDialogListeners() {
    const dialog = this.querySelector('#edit-dialog');
    const saveBtn = this.querySelector('#save-btn');
    const deleteBtn = this.querySelector('#delete-btn');

    // Save button listener
    saveBtn.addEventListener('click', () => {
      const rowIndex = dialog.getAttribute('data-row-index');
      this.saveRowChanges(parseInt(rowIndex));
      dialog.close();
    });

    // Cancel button listener
    this.querySelector('#cancel-btn').addEventListener('click', () => {
      dialog.close();
    });

    // Delete button listener
    deleteBtn.addEventListener('click', () => {
      const rowIndex = dialog.getAttribute('data-row-index');
      this.deleteRow(parseInt(rowIndex));
      dialog.close();
    });
  }

  // Save the changes made in the dialog to the table
  async saveRowChanges(rowIndex) {
    const dialog = this.querySelector('#edit-dialog');
    const inputs = dialog.querySelectorAll('input');
    const endpoint = this.storedComponents.editEndpoint;

    // Update the current row's data with the new input values
    inputs.forEach(input => {
      this.currentRowData[input.name] = input.value;
    });

    // Update the rows array with the modified data
    this.rows[rowIndex] = { ...this.currentRowData };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.currentRowData)
      });

      const tbody = this.querySelector('tbody');
      this.renderRows(tbody, this.rows, this.hiddenColumns);
    } catch {
      alert("Can't update");
    }
  }

  // Delete the selected row
  async deleteRow(rowIndex) {
    const deleteEndpoint = this?.storedComponents?.deleteEndpoint;
    const username = this.currentRowData['usuario']; // Assuming 'usuario' is the username field
    const id = this.currentRowData['id']; // Assuming 'id' is the item identifier

    // console.log({ deleteEndpoint })
    try {
      const response = await fetch(deleteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, username })
      });

      if (response.ok) {
        // Remove the deleted row from the data
        this.rows.splice(rowIndex, 1);

        // Re-render the table with the updated data
        const tbody = this.querySelector('tbody');
        this.renderRows(tbody, this.rows, this.hiddenColumns);
      } else {
        alert("Failed to delete the row");
      }
    } catch {
      alert("Can't delete");
    }
  }

  sortTable(header) {
    // Toggle sort state
    this.sortState[header] = this.sortState[header] === 'asc' ? 'desc' : 'asc';

    // Sort data based on the current sort state
    const sortedData = this.rows.sort((a, b) => {
      const aValue = header === 'price' ? parseFloat(a[header]) : a[header];
      const bValue = header === 'price' ? parseFloat(b[header]) : b[header];

      // Handle numeric vs string comparison
      // Handle numeric and string comparisons
      if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
        // Convert to numbers if possible (for strings like "12.34")
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);
        return this.sortState[header] === 'asc' ? numA - numB : numB - numA;
      } else {
        // Fallback to lexicographic comparison if values are not numbers
        return this.sortState[header] === 'asc'
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      }
    });

    // Re-render the table with sorted data
    const tbody = this.querySelector('tbody');
    this.renderRows(tbody, sortedData, this.hiddenColumns);
  }

  getHiddenColumns(hideFromView) {
    return hideFromView ? hideFromView.split(',').map(col => col.trim()) : [];
  }
}
customElements.define('async-table', AsyncTable);
