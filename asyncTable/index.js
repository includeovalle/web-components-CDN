// Published: Mon Oct 14 07:25:05 PM CST 2024
// dom 18 may 2025 20:12:40 CST
// ATTRIBUTES: 
// endpoint : string; points the endpoint to get data
// searchAttribute: "/data"; represents the attribute we are getting from endpoint
// hideFromView?: [item1,item2,item3]; array of strings which contains columns to hide
// storedData?: string; this is a Proxy state created by user will be accesed by sessionStorage[storedData] 
// filterIcon?: src or icon to be used when a header is filtering
// iconPosition: "left"|"right"  position of the icon in retion with header
// columnsThatSort?: let user choose which headers will sort on his table
// pagination?: if true adds pagination to table 10 rows per defect... WORKING ON A BETTER APPROACH


/* FUCTIONALITIES:
  *
  * Sort when clicked on headers
  * if storedData is NOT passed this will fetch from localhost/api API
  * fallback to slot name="tag" if anything goes wrong
  * exposed CSS with ::part(table) and ::part(pagination)
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
  static observedAttributes = ['rowsPerPage'];

  constructor() {
    super();
    this.sortState = {};
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.shadow = this.attachShadow({ mode: 'open' });

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(`
      :host { display: block; }
      table { width: 100%; border-collapse: collapse; }
      th { cursor: pointer; text-align: left; }
      td, th { padding: 8px; border: 1px solid #ccc; }
      .pagination-controls { margin-top: 10px; display: flex; gap: 4px; }
    `);
    this.shadow.adoptedStyleSheets = [styleSheet];
  }

  attributeChangedCallback(name, _, newVal) {
    if (name === 'rowsPerPage' && !isNaN(parseInt(newVal))) {
      this.rowsPerPage = parseInt(newVal);
    }
  }

  async connectedCallback() {
    this.elementExtraSlot = this.querySelector('[data-extra-slot]');
    this.elementLeftSlot = this.querySelector('[slot="lateralleft"]');
    this.elementRightSlot = this.querySelector('[slot="lateralright"]');

    this.storedComponents = {
      endpoint: this.getAttribute('endpoint'),
      hideFromView: this.getAttribute('hideFromView'),
      searchAttribute: this.getAttribute('searchAttribute'),
      storedData: this.getAttribute('storedData'),
      columnsThatSort: (this.getAttribute('columnsThatSort') || '').split(',').map((s) => s.trim()),
      filterIcon: this.getAttribute('filterIcon') || '',
      iconPosition: this.getAttribute('iconPosition') || 'right',
      pagination: this.getAttribute('pagination') === 'true',
    };

    if (document.readyState !== 'complete') {
      await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    }

    let data = null;
    if (this.storedComponents.storedData && sessionStorage[this.storedComponents.storedData]) {
      try {
        const stored = JSON.parse(sessionStorage[this.storedComponents.storedData]);
        data =
          stored?.[this.storedComponents.endpoint]?.[this.storedComponents.searchAttribute] || [];
      } catch (e) {
        console.warn('Error parsing sessionStorage data:', e);
      }
    }

    if (!data) {
      try {
        const response = await fetch(this.storedComponents.endpoint);
        const fetchedData = await response.json();
        data = fetchedData[this.storedComponents.searchAttribute] || [];

        if (this.storedComponents.storedData) {
          sessionStorage[this.storedComponents.storedData] = JSON.stringify({
            [this.storedComponents.endpoint]: fetchedData,
          });
        }
      } catch (error) {
        console.error('Failed to fetch data from API:', error);
        this.renderFallback();
        return;
      }
    }

    if (!Array.isArray(data) || data.length === 0) {
      this.renderFallback();
      return;
    }

    this.rows = data;
    this.hiddenColumns = this.getHiddenColumns(this.storedComponents.hideFromView);
    this.renderTable();

    this.shadow.addEventListener('click', (e) => {
      const el = e.target.closest('[endpoint]');
      if (!el) return;

      const endpoint = el.getAttribute('endpoint');
      const ids = JSON.parse(el.getAttribute('ids') || '[]');
      const anchor = el.closest(el.getAttribute('closest') || 'tr');

      const payload = Object.fromEntries(
        ids.map((id) => {
          const target = anchor?.querySelector(`#${id}`);
          return [id, target?.textContent?.trim()];
        })
      );

      this.dispatchEvent(
        new CustomEvent('post-request', {
          bubbles: true,
          composed: true,
          detail: { endpoint, payload, button: el },
        })
      );
    });
  }

  renderFallback() {
    this.shadow.innerHTML = '';
    const slot = document.createElement('slot');
    slot.name = 'tag';
    this.shadow.appendChild(slot);
  }

  renderTable() {
    const template = document.createElement('template');
    template.innerHTML = `
      <slot name="tag"></slot>
      <table part="table">
        <thead><tr id="header-row"></tr></thead>
        <tbody id="body-rows"></tbody>
      </table>
      ${this.storedComponents.pagination ? `<div part="pagination" class="pagination-controls"></div>` : ''}
    `;

    const content = template.content.cloneNode(true);
    const headerRow = content.querySelector('#header-row');
    const tbody = content.querySelector('#body-rows');
    const headers = Object.keys(this.rows[0] || {});

    if (this.elementLeftSlot) headerRow.appendChild(document.createElement('th'));

    headers.forEach((header) => {
      const th = document.createElement('th');
      if (this.storedComponents.filterIcon) {
        const icon = document.createElement('img');
        icon.src = this.storedComponents.filterIcon;
        icon.alt = 'sort';
        icon.style.width = '1em';
        icon.style.height = '1em';
        icon.style.verticalAlign = 'middle';
        this.storedComponents.iconPosition === 'left'
          ? th.append(icon, ` ${header}`)
          : th.append(`${header} `, icon);
      } else {
        th.textContent = header;
      }

      if (this.hiddenColumns.includes(header)) {
        th.hidden = true;
      }

      if (this.storedComponents.columnsThatSort.includes(header)) {
        th.addEventListener('click', () => this.sortTable(header));
      }

      headerRow.appendChild(th);
    });

    if (this.elementExtraSlot) headerRow.appendChild(document.createElement('th'));
    if (this.elementRightSlot) headerRow.appendChild(document.createElement('th'));

    while (this.shadow.firstChild) {
      this.shadow.removeChild(this.shadow.firstChild);
    }

    this.shadow.appendChild(content);
    this.renderRows(this.shadow.querySelector('tbody'));

    if (this.storedComponents.pagination) {
      this.renderPaginationControls();
    }
  }

  renderRows(tbody) {
    tbody.innerHTML = '';
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    const currentRows = this.storedComponents.pagination ? this.rows.slice(start, end) : this.rows;

    currentRows.forEach((row) => {
      const tr = document.createElement('tr');

      if (this.elementLeftSlot) {
        const td = document.createElement('td');
        const node = this.elementLeftSlot.cloneNode(true);
        const button = node.querySelector('[endpoint]');
        if (button) td.appendChild(button);
        else td.appendChild(node);
        tr.appendChild(td);
      }

      Object.keys(row).forEach((header) => {
        const td = document.createElement('td');
        td.id = header;
        td.textContent = row[header];
        if (this.hiddenColumns.includes(header)) {
          td.hidden = true;
        }
        tr.appendChild(td);
      });

      if (this.elementExtraSlot) {
        const td = document.createElement('td');
        td.appendChild(this.elementExtraSlot.cloneNode(true));
        tr.appendChild(td);
      }

      if (this.elementRightSlot) {
        const td = document.createElement('td');
        const node = this.elementRightSlot.cloneNode(true);
        td.appendChild(node);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });
  }

  renderPaginationControls() {
    const container = this.shadow.querySelector('.pagination-controls');
    container.innerHTML = '';
    const totalPages = Math.ceil(this.rows.length / this.rowsPerPage);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === this.currentPage) btn.disabled = true;
      btn.addEventListener('click', () => {
        this.currentPage = i;
        this.renderRows(this.shadow.querySelector('tbody'));
        this.renderPaginationControls();
      });
      container.appendChild(btn);
    }
  }

  sortTable(header) {
    const order = this.sortState[header] === 'asc' ? 'desc' : 'asc';
    this.sortState[header] = order;
    this.rows.sort((a, b) => {
      const aVal = a[header];
      const bVal = b[header];
      return !isNaN(aVal) && !isNaN(bVal)
        ? order === 'asc'
          ? aVal - bVal
          : bVal - aVal
        : order === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
    });
    this.currentPage = 1;
    this.renderRows(this.shadow.querySelector('tbody'));
    if (this.storedComponents.pagination) this.renderPaginationControls();
  }

  getHiddenColumns(hideFromView) {
    if (hideFromView === '*') return Object.keys(this.rows[0] || []);
    return hideFromView ? hideFromView.split(',').map((col) => col.trim()) : [];
  }
}

customElements.define('async-table', AsyncTable);

