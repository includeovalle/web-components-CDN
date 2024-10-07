// Published: Mon Oct  7 12:05:20 PM CST 2024

// ATTRIBUTES: 
// endpoint : string; points the endpoint to get data
// searchAttribute: "/data"; represents the attribute we are getting from endpoint
// editEndpoint: string; is the enpoint to make changes to a record
// hideFromView: [item1,item2,item3]; array of strings which contains columns to hide
// class: this isn't a shadow dom component so we can use userss custom className
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
      storedData: this.getAttribute('storedData'),
    };

    // Check if this specific table instance has a data-extra-slot element
    this.elementExtraSlot = this.querySelector('[data-extra-slot]');

    let data = null;

    // Wait for 200ms before checking for the state in window[storedData]
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if storedData exists in window
    if (this.storedComponents.storedData && window[this.storedComponents.storedData]) {
      // Extract the data from Proxy
      const proxyData = window[this.storedComponents.storedData];
      data = proxyData[this.storedComponents.endpoint]?.[this.storedComponents.searchAttribute] || [];
    }

    // If no data is found in window[storedData], fetch it from the API
    if (!data) {
      try {
        const response = await fetch(this.storedComponents.endpoint);
        const fetchedData = await response.json();
        data = fetchedData[this.storedComponents.searchAttribute] || [];

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

  renderTable({ className }) {
    const template = document.createElement('template');
    template.innerHTML = `
      <slot name="tag"></slot>
      <table class="${className}">
        <thead>
          <tr id="header-row"></tr>
        </thead>
        <tbody id="body-rows"></tbody>
      </table>
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
  }

  renderRows(tbody, dataArray, hiddenColumns) {
    tbody.innerHTML = ''; // Clear existing rows

    dataArray.forEach((row) => {
      const tr = document.createElement('tr');

      // Add the data for each column in the row
      Object.keys(row).forEach(header => {
        if (!hiddenColumns.includes(header)) {
          const td = document.createElement('td');
          td.textContent = row[header];
          tr.appendChild(td);
        }
      });

      // Check for extra slot only in the current table instance
      if (this.elementExtraSlot) {
        const clone = this.elementExtraSlot.cloneNode(true);
        const extraRowContainer = document.createElement('td');
        clone.style.display = 'block';
        extraRowContainer.appendChild(clone);
        tr.appendChild(extraRowContainer);
      }

      tbody.appendChild(tr);
    });
  }

  sortTable(header) {
    // Toggle sort state
    this.sortState[header] = this.sortState[header] === 'asc' ? 'desc' : 'asc';

    // Sort data based on the current sort state
    const sortedData = this.rows.sort((a, b) => {
      const aValue = header === 'price' ? parseFloat(a[header]) : a[header];
      const bValue = header === 'price' ? parseFloat(b[header]) : b[header];

      if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);
        return this.sortState[header] === 'asc' ? numA - numB : numB - numA;
      } else {
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
