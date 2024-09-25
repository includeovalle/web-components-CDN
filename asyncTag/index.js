// async-tag-injector.js
//<async-tag type="p" endpoint="/api/user" searchAttribute="user"> default value </async-tag>

const templates = {
  span: document.createElement('template'),
  h1: document.createElement('template'),
  p: document.createElement('template'),
  div: document.createElement('template'),
  a: document.createElement('template'),
};

templates.span.innerHTML = `<span><slot></slot></span>`;
templates.h1.innerHTML = `<h1><slot></slot></h1>`;
templates.p.innerHTML = `<p><slot></slot></p>`;
templates.div.innerHTML = `<div><slot></slot></div>`;
templates.a.innerHTML = `<a><slot></slot></a>`;

class InjectorGenerator extends HTMLElement {
  constructor() {
    super();
    // No shadow DOM
  }

  async connectedCallback() {
    const type = this.getAttribute('type') || 'span';
    const className = this.getAttribute('class') || '';
    const endpoint = this.getAttribute("endpoint");
    const attribute = this.getAttribute("searchAttribute");
    const template = templates[type];
    const content = template.content.cloneNode(true);
    const element = content.firstChild;
    element.className = className;

    // Preserve initial content
    const initialContent = this.innerHTML.trim();

    // Clear the initial content
    this.innerHTML = '';
    // Append content
    this.appendChild(content);

    // Set initial content
    element.innerText = initialContent;

    // Fetch data and set content
    try {
      if (!endpoint) return console.error('No endpoint provided');
      const response = await fetch(endpoint);
      this.removeAttribute('endpoint');
      this.removeAttribute('error');
      this.removeAttribute('type');
      this.removeAttribute('searchattribute');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const query = await data[attribute]

      element.innerText = query ? query : "default";

    } catch (error) {
      console.error('Fetch error:', error);
    }
  }
}

class AsyncTable extends HTMLElement {
  constructor() {
    super();
    this.sortState = {};
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

    // Create the table
    this.renderTable({ className });
  }

  renderTable({ className }) {
    const table = document.createElement('table');
    table.className = className; // Set the class name here

    const headers = Object.keys(this.rows[0] || {});

    // Create the header row
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      if (!this.hiddenColumns.includes(header)) {
        const th = document.createElement('th');
        th.textContent = header;

        // Add click event for sorting
        th.addEventListener('click', () => this.sortTable(header));
        headerRow.appendChild(th);
      }
    });
    table.appendChild(headerRow);

    // Create the body and populate it
    const tbody = document.createElement('tbody');
    this.renderRows(tbody, this.rows, this.hiddenColumns);
    table.appendChild(tbody);

    // Clear previous content and append new table
    this.innerHTML = ''; // Clear existing content
    this.appendChild(table); // Append the table
  }

  renderRows(tbody, dataArray, hiddenColumns) {
    tbody.innerHTML = ''; // Clear existing rows
    dataArray.forEach(row => {
      const tr = document.createElement('tr');
      Object.keys(row).forEach(header => {
        if (!hiddenColumns.includes(header)) {
          const td = document.createElement('td');
          td.textContent = row[header];
          tr.appendChild(td);
        }
      });
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
customElements.define('async-tag', InjectorGenerator);
