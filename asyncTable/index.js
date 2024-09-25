// attributes: 
// endpoint : string; points the endpoint to get data
// hideFromView: [item1,item2,item3]; array of strings which contains columns to hide
// searchAttribute: "/data"; represents the attribute we are getting from endpoint
// className: this isn't a shadow dom component so we can use userss custom className

class AsyncTable extends HTMLElement {
  constructor() {
    super();
    this.sortState = {};
    this.currentRowData = null; // Store the row data being edited
  }

  async connectedCallback() {
    const endpoint = this.getAttribute('endpoint');
    const hideFromView = this.getAttribute('hideFromView');
    const searchAttribute = this.getAttribute('searchAttribute');
    const className = this.getAttribute('class') || '';

    // Fetch data from the endpoint
    const response = await fetch(endpoint);
    const data = await response.json();
    this.rows = data[searchAttribute] || [];
    this.hiddenColumns = this.getHiddenColumns(hideFromView);

    // Render the table
    this.renderTable({ className });
  }

  renderTable({ className }) {
    const template = document.createElement('template');
    template.innerHTML = `
      <table class="${className}">
        <thead>
          <tr id="header-row"></tr>
        </thead>
        <tbody id="body-rows"></tbody>
      </table>

      <!-- Dialog Modal for Editing Row -->
      <dialog id="edit-dialog">
        <form method="dialog">
          <h3>Edit Row</h3>
          <div id="edit-fields"></div>
          <menu>
            <button class="${className}" >Cancel</button>
            <button class="${className}" id="save-btn" type="submit">Save</button>
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
    dataArray.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      Object.keys(row).forEach(header => {
        if (!hiddenColumns.includes(header)) {
          const td = document.createElement('td');
          td.textContent = row[header];
          tr.appendChild(td);
        }
      });

      // Add onclick event to open dialog for editing the clicked row
      tr.addEventListener('click', () => this.openEditDialog(row, rowIndex));
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
  }

  // Save the changes made in the dialog to the table
  saveRowChanges(rowIndex) {
    const dialog = this.querySelector('#edit-dialog');
    const inputs = dialog.querySelectorAll('input');
    
    // Update the current row's data with the new input values
    inputs.forEach(input => {
      this.currentRowData[input.name] = input.value;
    });

    // Update the rows array with the modified data
    this.rows[rowIndex] = { ...this.currentRowData };

    // Re-render the table with updated data
    const tbody = this.querySelector('tbody');
    this.renderRows(tbody, this.rows, this.hiddenColumns);
  }

  sortTable(header) {
    // Toggle sort state
    this.sortState[header] = this.sortState[header] === 'asc' ? 'desc' : 'asc';

    // Sort data based on the current sort state
    const sortedData = this.rows.sort((a, b) => {
      const aValue = header === 'price' ? parseFloat(a[header]) : a[header];
      const bValue = header === 'price' ? parseFloat(b[header]) : b[header];

      // Handle numeric vs string comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortState[header] === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return this.sortState[header] === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
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
