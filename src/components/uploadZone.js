import { importFromEDF } from '../data/loader.js';
import { addUploadedPatient } from '../data/patientCatalog.js';
import { setActivePatient } from '../state/params.js';

const SIZE_WARN = 500 * 1024 * 1024;

export function createUploadZone(containerId, { onUpload } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const zone = document.createElement('div');
  zone.className = 'upload-zone';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.edf';
  input.className = 'upload-input';

  const label = document.createElement('div');
  label.className = 'upload-label';
  label.textContent = 'Drop an .edf file here or click to browse';

  const status = document.createElement('div');
  status.className = 'upload-status';

  zone.appendChild(input);
  zone.appendChild(label);
  zone.appendChild(status);
  container.appendChild(zone);

  input.addEventListener('change', () => {
    if (input.files.length > 0)
      handleFile(input.files[0], zone, status, onUpload);
    input.value = '';
  });

  zone.addEventListener('click', (e) => {
    if (e.target !== input) input.click();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0], zone, status, onUpload);
    }
  });
}

async function handleFile(file, zone, statusEl, onUpload) {
  if (!file.name.toLowerCase().endsWith('.edf')) {
    statusEl.className = 'upload-status upload-error';
    statusEl.textContent = 'Only .edf files are supported';
    return;
  }

  if (file.size > SIZE_WARN) {
    const ok = confirm(
      `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Parse it in browser?`,
    );
    if (!ok) return;
  }

  statusEl.className = 'upload-status upload-progress';
  statusEl.innerHTML =
    '<div class="upload-spinner"></div><span>Parsing EDF…</span>';

  try {
    const id = await importFromEDF(file);
    addUploadedPatient(id);
    setActivePatient(id);

    statusEl.className = 'upload-status upload-success';
    statusEl.textContent = `Loaded patient ${id}`;

    setTimeout(() => {
      statusEl.className = 'upload-status';
      statusEl.textContent = '';
    }, 3000);

    if (onUpload) onUpload(id);
  } catch (err) {
    console.error('EDF upload failed:', err);
    statusEl.className = 'upload-status upload-error';
    statusEl.textContent = `Failed: ${err.message}`;
  }
}
