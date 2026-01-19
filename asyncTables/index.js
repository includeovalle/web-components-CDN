class TableRenderOrchestrator extends HTMLElement {
  constructor() {
    super();
    this.tableStates = new Map();
  }

  connectedCallback() {
    // Un pequeño delay para asegurar que el DOM inicial sea legible
    setTimeout(() => this.init(), 100);
  }

  async init() {
    const rawIds = this.getAttribute('ids') || '';
    const idList = rawIds
      .split(',')
      .map((id) => id.replace(/['"\s]/g, ''))
      .filter(Boolean);

    for (const id of idList) {
      const targetTable = document.getElementById(id);
      if (targetTable) {
        await this.setupTable(targetTable);
      } else {
        console.warn('⚠️ TableRender: No se encontró la tabla:', id);
      }
    }
  }

  async setupTable(table) {
    // 1. Captura de Configuración y Moldes de Slots
    const slotL = table.querySelector('[slot="lateralleft"]');
    const slotR = table.querySelector('[slot="lateralright"]');

    const config = {
      endpoint: table.getAttribute('endpoint'),
      searchAttribute:
        table.getAttribute('checkAttribute') || table.getAttribute('searchattribute'),
      hideFromView: (table.getAttribute('hideFromView') || '').split(',').map((s) => s.trim()),
      slotLeft: slotL ? slotL.cloneNode(true) : null,
      slotRight: slotR ? slotR.cloneNode(true) : null,
      className: table.className,
      originalId: table.id,
    };

    const response = await this.fetchData(config.endpoint);
    if (!response) return;

    // 2. Extraer el nodo de datos (ej: "Alumnos" o "equipos")
    const rootData = config.searchAttribute.split('.').reduce((o, i) => o?.[i], response);

    if (!rootData) {
      console.error(`❌ No se encontraron datos en el path: ${config.searchAttribute}`);
      return;
    }

    const container = table.parentElement;
    const placeholder = document.createElement('div');
    table.replaceWith(placeholder);

    // 3. DETERMINAR MODO: Basado en tus logs reales
    const isObject = typeof rootData === 'object' && rootData !== null && !Array.isArray(rootData);
    const isArray = Array.isArray(rootData);

    if (isObject) {
      const groups = Object.keys(rootData);
      groups.forEach((groupName, index) => {
        const rows = rootData[groupName];
        this.renderSingleTable(container, placeholder, groupName, rows, config, index);
      });
    } else if (isArray) {
      this.renderSingleTable(container, placeholder, null, rootData, config, 'main');
    }

    placeholder.remove();
  }

  renderSingleTable(container, referenceNode, titleText, rows, config, suffix) {
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText.replace(/_/g, ' ');
      h3.style.margin = '2rem 0 1rem 0';
      h3.style.color = 'var(--text-primary, #333)';
      container.insertBefore(h3, referenceNode);
    }

    const newTable = document.createElement('table');
    newTable.className = config.className;
    newTable.id = `${config.originalId}_${suffix}`;
    container.insertBefore(newTable, referenceNode);

    // Guardamos estado para este ID específico
    this.tableStates.set(newTable.id, { rows, ...config });
    this.renderTableContent(newTable);
  }

  async fetchData(url) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (e) {
      console.error('❌ Error en Fetch:', e);
      return null;
    }
  }

  renderTableContent(table) {
    const state = this.tableStates.get(table.id);
    const hasRows = state.rows && state.rows.length > 0;

    if (!hasRows) {
      table.innerHTML = `<tbody><tr><td style="padding:20px; text-align:center; opacity:0.7;">No hay datos en este grupo</td></tr></tbody>`;
      return;
    }

    const headers = Object.keys(state.rows[0]);
    table.innerHTML = `
      <thead>
        <tr>
          ${state.slotLeft ? '<th></th>' : ''}
          ${headers
            .map(
              (h) => `
            <th style="${state.hideFromView.includes(h) ? 'display:none' : ''}">${h}</th>
          `
            )
            .join('')}
          ${state.slotRight ? '<th></th>' : ''}
        </tr>
      </thead>
      <tbody class="render-body"></tbody>
    `;

    this.renderRows(table);
  }

  renderRows(table) {
    const state = this.tableStates.get(table.id);
    const tbody = table.querySelector('.render-body');
    const headers = Object.keys(state.rows[0]);

    state.rows.forEach((row) => {
      const tr = document.createElement('tr');

      if (state.slotLeft) this.appendSlot(tr, state.slotLeft);

      headers.forEach((h) => {
        const td = document.createElement('td');
        td.id = h;
        if (state.hideFromView.includes(h)) td.style.display = 'none';

        const val = row[h];
        // Sanitización básica: nulls a vacío, objetos a JSON
        td.textContent = val === null ? '' : typeof val === 'object' ? JSON.stringify(val) : val;
        tr.appendChild(td);
      });

      if (state.slotRight) this.appendSlot(tr, state.slotRight);

      tbody.appendChild(tr);
    });
  }

  appendSlot(tr, slotSource) {
    const clone = slotSource.cloneNode(true);
    clone.removeAttribute('slot');

    // Si el clon ya es un TD, lo inyectamos directo. Si no, creamos un TD contenedor.
    if (clone.tagName === 'TD') {
      tr.appendChild(clone);
    } else {
      const td = document.createElement('td');
      td.appendChild(clone);
      tr.appendChild(td);
    }
  }
}

customElements.define('table-render', TableRenderOrchestrator);
