import { getPatients, isCatalogEnabled } from '../data/patientCatalog.js';
import { setActivePatient } from '../state/params.js';

const PAGE_SIZE = 50;
let patientMap = new Map();
let filterText = '';
let sortKey = 'id';
let sortAsc = true;
let selected = new Set();
let onNavigate = null;
let currentPage = 1;

export function createPatientBrowser(containerId, { onSwitchPatient } = {}) {
  onNavigate = onSwitchPatient || null;
  const container = document.getElementById(containerId);
  if (!container) return;

  const header = document.createElement('div');
  header.className = 'patients-header';

  const title = document.createElement('h1');
  title.textContent = 'Patient Library';
  header.appendChild(title);

  const toolbar = document.createElement('div');
  toolbar.className = 'patients-toolbar';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search by ID, age, AHI...';
  searchInput.className = 'patients-search';
  searchInput.addEventListener('input', (e) => {
    filterText = e.target.value.toLowerCase();
    currentPage = 1;
    render();
  });
  toolbar.appendChild(searchInput);

  const compareBtn = document.createElement('button');
  compareBtn.className = 'patients-compare-btn';
  compareBtn.textContent = 'Compare Selected';
  compareBtn.disabled = true;
  compareBtn.addEventListener('click', () => {
    const evt = new CustomEvent('compare-patients', {
      detail: { ids: [...selected] },
    });
    document.dispatchEvent(evt);
  });
  toolbar.appendChild(compareBtn);

  header.appendChild(toolbar);
  container.appendChild(header);

  if (isCatalogEnabled()) {
    const info = document.createElement('p');
    info.className = 'patients-info';
    info.textContent = 'Loading from SHHS dataset...';
    container.appendChild(info);
  }

  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'patients-table-wrapper';
  container.appendChild(tableWrapper);

  const paginationEl = document.createElement('div');
  paginationEl.className = 'patients-pagination';
  container.appendChild(paginationEl);

  loadAndRender();
}

async function loadAndRender() {
  try {
    const patients = await getPatients();
    patientMap = new Map(patients.map((p) => [p.id, p]));
    render();
  } catch (err) {
    console.warn('Failed to load patient catalog:', err);
  }
}

function getFiltered() {
  const all = [...patientMap.values()];

  const filtered = all.filter((p) => {
    if (!filterText) return true;
    return Object.values(p).some(
      (v) => v != null && String(v).toLowerCase().includes(filterText),
    );
  });

  filtered.sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'string') {
      const cmp = va.localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    }
    return sortAsc ? va - vb : vb - va;
  });

  return filtered;
}

function render() {
  const wrapper = document.querySelector('.patients-table-wrapper');
  if (!wrapper) return;

  const info = document.querySelector('.patients-info');
  if (info) {
    info.textContent = `${patientMap.size} patients loaded`;
  }

  const filtered = getFiltered();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filtered.slice(start, start + PAGE_SIZE);

  const columns = [
    { key: 'id', label: 'Patient ID' },
    { key: 'age', label: 'Age' },
    { key: 'sex', label: 'Sex' },
    { key: 'bmi', label: 'BMI' },
    { key: 'ahi', label: 'AHI' },
  ];

  let table = '<table class="patients-table"><thead><tr>';
  columns.forEach((col) => {
    const arrow =
      sortKey === col.key ? (sortAsc ? ' &#9650;' : ' &#9660;') : '';
    table += `<th data-key="${col.key}">${col.label}${arrow}</th>`;
  });
  table += '<th>Signals</th><th></th></tr></thead><tbody>';

  page.forEach((p) => {
    const checked = selected.has(p.id) ? 'checked' : '';
    const signalBadge = p.has_signals
      ? '<span class="badge badge-available">Detailed signals</span>'
      : '<span class="badge badge-unavailable">Metrics only</span>';
    table += `<tr data-id="${p.id}" class="${checked ? 'selected' : ''}">`;
    columns.forEach((col) => {
      let val = p[col.key];
      if (val == null) val = '—';
      if (col.key === 'ahi' && val !== '—') val = Number(val).toFixed(1);
      table += `<td>${val}</td>`;
    });
    table += `<td>${signalBadge}</td>`;
    table += `<td><input type="checkbox" class="patient-select" ${checked}></td>`;
    table += '</tr>';
  });

  table += '</tbody></table>';
  wrapper.innerHTML = table;

  wrapper.querySelectorAll('th').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (sortKey === key) sortAsc = !sortAsc;
      else {
        sortKey = key;
        sortAsc = true;
      }
      currentPage = 1;
      render();
    });
  });

  wrapper.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
      const id = e.target.closest('tr').dataset.id;
      if (e.target.checked) selected.add(id);
      else selected.delete(id);
      const btn = document.querySelector('.patients-compare-btn');
      if (btn) btn.disabled = selected.size < 2;
      e.target.closest('tr').classList.toggle('selected', e.target.checked);
      return;
    }

    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const id = row.dataset.id;
    const patient = patientMap.get(id);
    if (patient && patient.has_signals) {
      navigateToPatient(id);
    }
  });

  renderPagination(filtered.length, totalPages);
}

function renderPagination(total, totalPages) {
  const el = document.querySelector('.patients-pagination');
  if (!el) return;

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  let html = `<span class="pag-info">Showing ${start}–${end} of ${total}</span>`;

  if (totalPages > 1) {
    html += '<div class="pag-controls">';
    html += `<button class="pag-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&#9664; Prev</button>`;

    const range = getPageRange(currentPage, totalPages);
    range.forEach((p) => {
      if (p === '...') {
        html += '<span class="pag-ellipsis">…</span>';
      } else {
        html += `<button class="pag-btn ${p === currentPage ? 'pag-active' : ''}" data-page="${p}">${p}</button>`;
      }
    });

    html += `<button class="pag-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next &#9654;</button>`;
    html += '</div>';
  }

  el.innerHTML = html;

  el.querySelectorAll('.pag-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        render();
        document
          .querySelector('.patients-table-wrapper')
          .scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function getPageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const range = [];
  if (current <= 3) {
    for (let i = 1; i <= 4; i++) range.push(i);
    range.push('...');
    range.push(total);
  } else if (current >= total - 2) {
    range.push(1);
    range.push('...');
    for (let i = total - 3; i <= total; i++) range.push(i);
  } else {
    range.push(1);
    range.push('...');
    range.push(current - 1, current, current + 1);
    range.push('...');
    range.push(total);
  }
  return range;
}

function navigateToPatient(id) {
  setActivePatient(id);
  if (onNavigate) {
    onNavigate(id);
  }
}
