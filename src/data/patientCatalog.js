import { getDuckDB, coordExec, q } from './loader.js';

let initialized = false;
let catalogEnabled = false;
const patientsWithSignals = new Set();

export function isCatalogEnabled() {
  return catalogEnabled;
}

export async function initPatientCatalog() {
  if (initialized) return;
  initialized = true;

  const enabled = import.meta.env.VITE_SHH_DATASET_ENABLED === 'true';
  const shhFile = import.meta.env.VITE_SHH_DATASET_FILE;

  if (enabled && shhFile) {
    const loaded = await tryLoadSHHSDataset(shhFile);
    if (loaded) {
      catalogEnabled = true;
      await loadSignalManifest();
      return;
    }
  }

  await setupSinglePatient();
}

async function tryLoadSHHSDataset(shhFile) {
  const base = import.meta.env.BASE_URL || '/';
  const url = `${base}${shhFile}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    const db = await getDuckDB();
    const filename = 'shhs1-dataset.csv';
    await db.registerFileBuffer(filename, new Uint8Array(buffer));
    await coordExec(`
      CREATE OR REPLACE TABLE patients AS
      SELECT
        "nsrrid"::VARCHAR AS id,
        "age_s1"::INT AS age,
        "gender"::VARCHAR AS sex,
        "bmi_s1"::DOUBLE AS bmi,
        "rdi4p"::DOUBLE AS ahi,
        "slplatp"::DOUBLE AS sleep_latency,
        "timebedp"::DOUBLE AS time_in_bed,
        "timest1p"::DOUBLE AS n1_pct,
        "timest2p"::DOUBLE AS n2_pct,
        "times34p"::DOUBLE AS n34_pct,
        "timeremp"::DOUBLE AS rem_pct,
        "waso"::DOUBLE AS waso,
        "htnderv_s1"::VARCHAR AS hypertension,
        "shhs1_tcvd"::VARCHAR AS cvd_outcome,
        "smokstat_s1"::VARCHAR AS smoking
      FROM read_csv_auto('${filename}', header=true, delim=',', ignore_errors=true)
    `);
    return true;
  } catch (err) {
    console.warn('Failed to load SHHS dataset:', err.message);
    return false;
  }
}

async function setupSinglePatient() {
  await coordExec(`
    CREATE OR REPLACE TABLE patients AS
    SELECT '0000' AS id, NULL::INT AS age, NULL::VARCHAR AS sex,
           NULL::DOUBLE AS bmi, NULL::DOUBLE AS ahi
  `);
  patientsWithSignals.add('0000');
}

async function loadSignalManifest() {
  const base = import.meta.env.BASE_URL || '/';
  try {
    const resp = await fetch(`${base}Resources/signal_manifest.json`);
    if (resp.ok) {
      const ids = await resp.json();
      ids.forEach((id) => patientsWithSignals.add(id));
      return;
    }
  } catch {
    /* manifest not available */
  }
  patientsWithSignals.add('0000');
}

export async function getPatients() {
  const rows = await q('SELECT * FROM patients ORDER BY id');
  return rows.map((p) => ({
    ...p,
    has_signals: patientsWithSignals.has(p.id),
  }));
}

export function addUploadedPatient(id) {
  patientsWithSignals.add(id);
  coordExec(
    `INSERT INTO patients VALUES ('${id}', NULL, NULL, NULL, NULL)`,
  ).catch(() => {});
}
