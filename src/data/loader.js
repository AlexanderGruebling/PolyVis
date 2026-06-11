import * as vg from '@uwdata/vgplot';
import signalsUrl from '/Resources/0000_signals.csv?url';
import hypnUrl from '/Resources/0000_hypn.csv?url';
import arouUrl from '/Resources/0000_arou.csv?url';
import respUrl from '/Resources/0000_resp.csv?url';

const getFullUrl = (relativeUrl) => `${window.location.origin}${relativeUrl}`;

const coord = vg.coordinator();
let loaded = false;

async function loadCSV(name, url) {
  await coord.query(
    `CREATE TABLE "${name}" AS SELECT * FROM read_csv_auto('${url}', header=true, delim=',')`,
    { type: 'json' },
  );
}

export async function initLoader() {
  if (loaded) return;
  loaded = true;

  coord.databaseConnector(vg.wasmConnector());
  coord.logger(null);

  const datasets = [
    { name: 'signal', url: getFullUrl(signalsUrl) },
    { name: 'hypn', url: getFullUrl(hypnUrl) },
    { name: 'arou', url: getFullUrl(arouUrl) },
    { name: 'resp', url: getFullUrl(respUrl) },
  ];

  for (const dataset of datasets) {
    await loadCSV(dataset.name, dataset.url);
  }
}

export function q(sql) {
  return coord.query(sql, { type: 'json' });
}
