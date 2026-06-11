import * as vg from '@uwdata/vgplot';
import signalsUrl from '/Resources/0000_signals.csv?url';
import hypnUrl from '/Resources/0000_hypn.csv?url';
import arouUrl from '/Resources/0000_arou.csv?url';
import respUrl from '/Resources/0000_resp.csv?url';

const getFullUrl = (relativeUrl) => `${window.location.origin}${relativeUrl}`;

const coord = vg.coordinator();
let loaded = false;

export async function initLoader() {
  if (loaded) return;
  loaded = true;

  const connector = vg.wasmConnector();
  coord.databaseConnector(connector);
  coord.logger(null);

  const db = await connector.getDuckDB();

  const datasets = [
    { name: 'signal', url: getFullUrl(signalsUrl) },
    { name: 'hypn', url: getFullUrl(hypnUrl) },
    { name: 'arou', url: getFullUrl(arouUrl) },
    { name: 'resp', url: getFullUrl(respUrl) },
  ];

  for (const dataset of datasets) {
    const response = await fetch(dataset.url);
    const buffer = await response.arrayBuffer();
    const filename = `${dataset.name}.csv`;
    await db.registerFileBuffer(filename, new Uint8Array(buffer));
    await coord.exec(
      `CREATE TABLE "${dataset.name}" AS SELECT * FROM read_csv_auto('${filename}', header=true, delim=',')`,
    );
  }

  await coord.exec(
    `CREATE OR REPLACE TABLE desats AS SELECT 0::DOUBLE AS x1, 0::DOUBLE AS x2, 0::DOUBLE AS depth WHERE FALSE`,
  );
}

export function q(sql) {
  return coord.query(sql, { type: 'json' });
}
