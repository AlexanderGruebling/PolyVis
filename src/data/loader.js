import * as vg from '@uwdata/vgplot';
import signalsUrl from '/Resources/0000_signals.csv?url';
import hypnUrl from '/Resources/0000_hypn.csv?url';
import arouUrl from '/Resources/0000_arou.csv?url';
import respUrl from '/Resources/0000_resp.csv?url';

const getFullUrl = (relativeUrl) => `${window.location.origin}${relativeUrl}`;

const coord = vg.coordinator();
let loaded = false;
let db = null;

export async function initLoader() {
  if (loaded) return;
  loaded = true;

  const connector = vg.wasmConnector();
  coord.databaseConnector(connector);
  coord.logger(null);

  db = await connector.getDuckDB();

  await loadPatientData('0000');
}

export async function loadPatientData(id) {
  if (!db) throw new Error('Loader not initialized');

  const base = import.meta.env.BASE_URL || '/';

  let datasets;
  if (id === '0000') {
    datasets = [
      { name: 'signal', url: getFullUrl(signalsUrl) },
      { name: 'hypn', url: getFullUrl(hypnUrl) },
      { name: 'arou', url: getFullUrl(arouUrl) },
      { name: 'resp', url: getFullUrl(respUrl) },
    ];
  } else {
    datasets = [
      { name: 'signal', file: `${id}_signals.csv` },
      { name: 'hypn', file: `${id}_hypn.csv` },
      { name: 'arou', file: `${id}_arou.csv` },
      { name: 'resp', file: `${id}_resp.csv` },
    ];
  }

  for (const dataset of datasets) {
    let url;
    if (dataset.url) {
      url = dataset.url;
    } else {
      url = `${base}Resources/${dataset.file}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Patient data not found: ${id}`);
    const buffer = await response.arrayBuffer();
    const filename = dataset.file || `${dataset.name}.csv`;
    await db.registerFileBuffer(filename, new Uint8Array(buffer));
    await coord.exec(
      `CREATE OR REPLACE TABLE "${dataset.name}" AS SELECT * FROM read_csv_auto('${filename}', header=true, delim=',')`,
    );
  }

  await coord.exec(
    `CREATE OR REPLACE TABLE desats AS SELECT 0::DOUBLE AS x1, 0::DOUBLE AS x2, 0::DOUBLE AS depth WHERE FALSE`,
  );
}

export async function getDuckDB() {
  return db;
}

export async function coordExec(sql) {
  return coord.exec(sql);
}

export function q(sql) {
  return coord.query(sql, { type: 'json' });
}
