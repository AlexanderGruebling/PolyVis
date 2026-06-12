import * as vg from '@uwdata/vgplot';
import { parseEDF, annotationsToTables } from '../utils/edfParser.js';
import { mapSignalLabel } from '../utils/edfSignalMap.js';
import signalsUrl from '/Resources/0000_signals.csv?url';
import hypnUrl from '/Resources/0000_hypn.csv?url';
import arouUrl from '/Resources/0000_arou.csv?url';
import respUrl from '/Resources/0000_resp.csv?url';

const SIGNAL_COLS = [
  'SaO2',
  'PR',
  'EEG(sec)',
  'ECG',
  'EMG',
  'EOG(L)',
  'EOG(R)',
  'EEG',
  'AIRFLOW',
  'THOR RES',
  'ABDO RES',
];

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

  if (id.startsWith('upload_')) return;

  const base = import.meta.env.BASE_URL || '/';

  let datasets;
  if (id === '0000') {
    datasets = [
      { name: 'signal_wide', url: getFullUrl(signalsUrl) },
      { name: 'hypn', url: getFullUrl(hypnUrl) },
      { name: 'arou', url: getFullUrl(arouUrl) },
      { name: 'resp', url: getFullUrl(respUrl) },
    ];
  } else {
    datasets = [
      { name: 'signal_wide', file: `${id}_signals.csv` },
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

  await convertSignalToLong();

  await coord.exec(
    `CREATE OR REPLACE TABLE desats AS SELECT 0::DOUBLE AS x1, 0::DOUBLE AS x2, 0::DOUBLE AS depth WHERE FALSE`,
  );
}

async function convertSignalToLong() {
  const cols = SIGNAL_COLS.map((c) => `"${c}"`).join(', ');
  await coord.exec(`
    CREATE OR REPLACE TABLE signal AS
    SELECT time::DOUBLE AS time, channel, value::DOUBLE AS value
    FROM signal_wide
    UNPIVOT (
      value FOR channel IN (${cols})
    )
  `);
  await coord.exec('DROP TABLE IF EXISTS signal_wide');
}

export async function importFromEDF(file) {
  if (!db) throw new Error('Loader not initialized');

  const buffer = await file.arrayBuffer();
  const parsed = parseEDF(buffer);

  const id = `upload_${Date.now()}`;

  await createSignalTable(parsed, id);
  await createAnnotationTables(parsed.annotations);
  await coord.exec(
    `CREATE OR REPLACE TABLE desats AS SELECT 0::DOUBLE AS x1, 0::DOUBLE AS x2, 0::DOUBLE AS depth WHERE FALSE`,
  );

  return id;
}

async function createSignalTable(parsed, uploadId) {
  await coord.exec(
    `CREATE OR REPLACE TABLE signal (time DOUBLE, channel VARCHAR, value DOUBLE)`,
  );

  let chunkIdx = 0;

  for (const sig of parsed.signals) {
    if (sig.isAnnotation || !sig.samples || sig.samples.length === 0) continue;

    const channel = mapSignalLabel(sig.label);
    const dt = parsed.recordDuration / sig.samplesPerRecord;
    const samples = sig.samples;
    const total = samples.length;

    const CHUNK = 30000;

    for (let start = 0; start < total; start += CHUNK) {
      const end = Math.min(start + CHUNK, total);
      const lines = [];
      for (let i = start; i < end; i++) {
        const v = samples[i];
        if (Number.isFinite(v)) {
          lines.push(`${(i * dt).toFixed(6)},"${channel}",${v}`);
        }
      }
      if (lines.length === 0) continue;

      const csv = 'time,channel,value\n' + lines.join('\n');
      const name = `edf_${uploadId}_${chunkIdx++}`;
      await db.registerFileBuffer(
        name,
        new TextEncoder().encode(csv),
      );
      await coord.exec(
        `INSERT INTO signal SELECT time::DOUBLE, channel::VARCHAR, value::DOUBLE FROM read_csv_auto('${name}', header=true)`,
      );
    }
  }
}

async function createAnnotationTables(annotations) {
  const { hypn, arou, resp } = annotationsToTables(annotations);

  const tableDefs = [
    {
      name: 'hypn',
      columns: ['Time', 'Sample#', 'Type', 'Sub', 'Chan', 'Num', 'Aux'],
      rows: hypn,
      fmt: (r) =>
        `('${r.Time}',${r['Sample#']},'${r.Type}',${r.Sub},${r.Chan},${r.Num},'${r.Aux}')`,
    },
    {
      name: 'arou',
      columns: [
        'Time',
        'Sample#',
        'Type',
        'Sub',
        'Chan',
        'Num',
        'Aux',
        'Duration',
      ],
      rows: arou,
      fmt: (r) =>
        `('${r.Time}',${r['Sample#']},'${r.Type}',${r.Sub},${r.Chan},${r.Num},'${r.Aux}','${r.Duration}')`,
    },
    {
      name: 'resp',
      columns: [
        'Time',
        'Sample#',
        'Type',
        'Sub',
        'Chan',
        'Num',
        'Aux',
        'Duration',
      ],
      rows: resp,
      fmt: (r) =>
        `('${r.Time}',${r['Sample#']},'${r.Type}',${r.Sub},${r.Chan},${r.Num},'${r.Aux}','${r.Duration}')`,
    },
  ];

  for (const td of tableDefs) {
    if (td.rows.length === 0) {
      await coord.exec(
        `CREATE OR REPLACE TABLE ${td.name} AS SELECT ` +
          `''::VARCHAR AS "Time", ` +
          `0::INT AS "Sample#", ` +
          `''::VARCHAR AS "Type", ` +
          `0::INT AS "Sub", ` +
          `0::INT AS "Chan", ` +
          `0::INT AS "Num", ` +
          `''::VARCHAR AS "Aux"` +
          (td.columns.includes('Duration') ? `, ''::VARCHAR AS "Duration"` : '') +
          ` WHERE FALSE`,
      );
    } else {
      const colDefs = td.columns.join(', ');
      const values = td.rows.map(td.fmt).join(', ');
      await coord.exec(
        `CREATE OR REPLACE TABLE ${td.name} AS SELECT * FROM (VALUES ${values}) AS t(${colDefs})`,
      );
    }
  }
}

export function getDuckDB() {
  return db;
}

export async function coordExec(sql) {
  return coord.exec(sql);
}

export function q(sql) {
  return coord.query(sql, { type: 'json' });
}
