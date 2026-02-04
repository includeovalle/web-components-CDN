class TableRenderOrchestrator extends HTMLElement {
  constructor() {
    super();
    this.tableStates = new Map();
  }

  connectedCallback() {
    setTimeout(() => this.init(), 90);
  }

  async init() {
    const rawIds = this.getAttribute('ids') || '';
    const idList = rawIds
      .split(',')
      .map((id) => id.replace(/['"\s]/g, ''))
      .filter(Boolean);

    for (const id of idList) {
      const table = document.getElementById(id);
      if (table) await this.setupTable(table);
    }
  }

  /* =====================================================
   * DATA PIPELINE
   * ===================================================== */

  normalizeRows(rows) {
    if (!Array.isArray(rows)) return [];

    return rows
      .filter(
        (row) =>
          row &&
          typeof row === 'object' &&
          Object.values(row).some((v) => v !== null && v !== undefined && v !== '')
      )
      .map((row) => {
        const out = {};
        for (const [k, v] of Object.entries(row)) {
          out[k] =
            v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : v;
        }
        return out;
      });
  }

  // ✅ ONLY removes all-empty columns
  resolveVisibleColumns(rows) {
    if (!rows.length) return [];

    const cols = Object.keys(rows[0]);

    return cols.filter((col) =>
      rows.some((r) => r[col] !== '' && r[col] !== null && r[col] !== undefined)
    );
  }

  /* =====================================================
   * TABLE SETUP
   * ===================================================== */

  async setupTable(table) {
    const slotLeft = table.querySelector('[slot="lateralleft"]');
    const slotRight = table.querySelector('[slot="lateralright"]');

    const config = {
      endpoint: table.getAttribute('endpoint'),
      searchAttribute:
        table.getAttribute('checkAttribute') || table.getAttribute('searchattribute'),
      columnsThatSort: (table.getAttribute('columnsThatSort') || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      hideFromView: (table.getAttribute('hideFromView') || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      slotLeft: slotLeft ? slotLeft.cloneNode(true) : null,
      slotRight: slotRight ? slotRight.cloneNode(true) : null,
      className: table.className,
      originalId: table.id,
    };

    const data = await this.fetchData(config.endpoint);
    if (!data) return;

    const root = config.searchAttribute?.split('.').reduce((o, i) => o?.[i], data);
    if (!root) return;

    const container = table.parentElement;
    const placeholder = document.createElement('div');
    table.replaceWith(placeholder);

    if (Array.isArray(root)) {
      this.createTable(container, placeholder, null, root, config, 'main');
    } else {
      Object.entries(root).forEach(([group, rows], idx) => {
        this.createTable(container, placeholder, group, rows, config, idx);
      });
    }

    placeholder.remove();
  }

  createTable(container, ref, title, rawRows, config, suffix) {
    const rows = this.normalizeRows(rawRows);
    if (!rows.length) return;

    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.replace(/_/g, ' ');
      h3.style.margin = '2rem 0 1rem';
      container.insertBefore(h3, ref);
    }

    const table = document.createElement('table');
    table.className = config.className;
    table.id = `${config.originalId}_${suffix}`;
    container.insertBefore(table, ref);

    this.tableStates.set(table.id, {
      rows,
      visibleColumns: this.resolveVisibleColumns(rows),
      sort: { column: null, direction: 'asc' },
      ...config,
    });

    this.renderTable(table);
  }

  /* =====================================================
   * RENDERING
   * ===================================================== */

  renderTable(table) {
    const state = this.tableStates.get(table.id);
    if (!state) return;

    table.innerHTML = `
      <thead>
        <tr>
          ${state.slotLeft ? '<th></th>' : ''}
          ${state.visibleColumns
            .map((col) => {
              const sortable = state.columnsThatSort.includes(col);
              const arrow =
                state.sort.column === col ? (state.sort.direction === 'asc' ? ' ▲' : ' ▼') : '';

              return `
                <th
                  data-col="${col}"
                  ${state.hideFromView.includes(col) ? 'hidden' : ''}
                  style="cursor:${sortable ? 'pointer' : 'default'}"
                >
                  ${col}${arrow}
                </th>
              `;
            })
            .join('')}
          ${state.slotRight ? '<th></th>' : ''}
        </tr>
      </thead>
      <tbody></tbody>
    `;

    this.attachSort(table);
    this.renderRows(table);
  }

  renderRows(table) {
    const state = this.tableStates.get(table.id);
    const tbody = table.querySelector('tbody');
    if (!state || !tbody) return;

    tbody.innerHTML = '';

    for (const row of state.rows) {
      const tr = document.createElement('tr');

      if (state.slotLeft) this.appendSlot(tr, state.slotLeft);

      state.visibleColumns.forEach((key) => {
        const td = document.createElement('td');
        td.id = key; // 🔑 DOM contract preserved
        td.textContent = row[key] ?? '';

        if (state.hideFromView.includes(key)) {
          td.hidden = true;
        }

        tr.appendChild(td);
      });

      if (state.slotRight) this.appendSlot(tr, state.slotRight);

      tbody.appendChild(tr);
    }
  }

  /* =====================================================
   * SORTING
   * ===================================================== */

  attachSort(table) {
    const state = this.tableStates.get(table.id);
    if (!state) return;

    table.querySelectorAll('th[data-col]').forEach((th) => {
      const col = th.dataset.col;
      if (!state.columnsThatSort.includes(col)) return;

      th.onclick = () => {
        const dir = state.sort.column === col && state.sort.direction === 'asc' ? 'desc' : 'asc';

        state.sort = { column: col, direction: dir };

        state.rows.sort((a, b) => {
          const av = a[col];
          const bv = b[col];

          if (!isNaN(av) && !isNaN(bv)) {
            return dir === 'asc' ? av - bv : bv - av;
          }

          return dir === 'asc'
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });

        this.renderTable(table);
      };
    });
  }

  /* =====================================================
   * SLOT HANDLING
   * ===================================================== */

  appendSlot(tr, slotSource) {
    const clone = slotSource.cloneNode(true);
    clone.removeAttribute('slot');

    if (clone.tagName === 'TD') {
      tr.appendChild(clone);
    } else {
      const td = document.createElement('td');
      td.appendChild(clone);
      tr.appendChild(td);
    }
  }

  /* =====================================================
   * UTIL
   * ===================================================== */

  async fetchData(url) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      console.error('[table-render] fetch error:', e);
      return null;
    }
  }
}

customElements.define('table-render', TableRenderOrchestrator);
