export function parseEDF(buffer) {
  const dv = new DataView(buffer);
  const textDecoder = new TextDecoder('ascii');

  function readStr(offset, length) {
    return textDecoder.decode(new Uint8Array(buffer, offset, length)).trim();
  }

  function readStrRaw(offset, length) {
    return textDecoder.decode(new Uint8Array(buffer, offset, length));
  }

  function readInt(offset, length) {
    return parseInt(readStr(offset, length), 10);
  }

  function readDouble(offset, length) {
    return parseFloat(readStr(offset, length));
  }

  const patientId = readStr(8, 80);
  const recordingId = readStr(88, 80);
  const startDate = readStr(168, 8);
  const startTime = readStr(176, 8);
  const headerBytes = readInt(184, 8);
  const numRecords = readInt(236, 8);
  const recordDuration = readDouble(244, 8);
  const numSignals = readInt(252, 4);

  if (isNaN(numSignals) || numSignals < 1 || numSignals > 999) {
    throw new Error(`Invalid EDF: numSignals=${numSignals}`);
  }

  const signalHeaders = readSignalHeaders(
    buffer,
    256,
    numSignals,
    recordDuration,
  );

  const dataStart = headerBytes;
  const dataSize = buffer.byteLength - dataStart;
  const bytesPerRecord = signalHeaders.reduce(
    (sum, s) => sum + s.samplesPerRecord * 2,
    0,
  );
  const actualNumRecords =
    numRecords > 0 ? numRecords : Math.floor(dataSize / bytesPerRecord);

  if (actualNumRecords > 0) {
    for (const sig of signalHeaders) {
      const totalSamples = actualNumRecords * sig.samplesPerRecord;
      if (sig.isAnnotation) {
        sig.rawBytes = new Uint8Array(totalSamples * 2);
      } else {
        sig.samples = new Float64Array(totalSamples);
      }
    }
  }

  let dataOffset = dataStart;
  for (let rec = 0; rec < actualNumRecords; rec++) {
    for (let s = 0; s < signalHeaders.length; s++) {
      const sig = signalHeaders[s];
      const baseIdx = rec * sig.samplesPerRecord;
      if (sig.isAnnotation) {
        for (let i = 0; i < sig.samplesPerRecord; i++) {
          const lo = dv.getUint8(dataOffset);
          const hi = dv.getUint8(dataOffset + 1);
          dataOffset += 2;
          sig.rawBytes[(baseIdx + i) * 2] = lo;
          sig.rawBytes[(baseIdx + i) * 2 + 1] = hi;
        }
      } else {
        for (let i = 0; i < sig.samplesPerRecord; i++) {
          const digVal = dv.getInt16(dataOffset, true);
          dataOffset += 2;
          let physVal;
          if (sig.digMax === sig.digMin) {
            physVal = digVal - sig.digMin + sig.physMin;
          } else {
            physVal =
              sig.physMin +
              ((digVal - sig.digMin) * (sig.physMax - sig.physMin)) /
                (sig.digMax - sig.digMin);
          }
          sig.samples[baseIdx + i] = physVal;
        }
      }
    }
  }

  let annotations = [];
  const annotationSig = signalHeaders.find((s) => s.isAnnotation);
  if (annotationSig && annotationSig.rawBytes) {
    annotations = parseAnnotations(annotationSig);
    signalHeaders.splice(signalHeaders.indexOf(annotationSig), 1);
  }

  return {
    patientId,
    recordingId,
    startDate,
    startTime,
    numSignals: signalHeaders.length,
    recordDuration,
    numRecords: actualNumRecords,
    signals: signalHeaders,
    annotations,
  };
}

function readSignalHeaders(buffer, baseOffset, numSignals, recordDuration) {
  const textDecoder = new TextDecoder('ascii');

  function readStr(offset, length) {
    return textDecoder.decode(new Uint8Array(buffer, offset, length)).trim();
  }

  function readInt(offset, length) {
    return parseInt(readStr(offset, length), 10);
  }

  function readDouble(offset, length) {
    return parseFloat(readStr(offset, length));
  }

  function detectLayout() {
    let labelCount = 0;
    for (let i = 0; i < numSignals; i++) {
      const label = readStr(baseOffset + i * 16, 16);
      if (label.length > 0 && /[a-zA-Z]/.test(label)) labelCount++;
    }
    return labelCount >= 3 ? 'column-major' : 'row-major';
  }

  const layout = detectLayout();
  const signals = [];

  if (layout === 'column-major') {
    readColumnMajor(buffer, baseOffset, numSignals, recordDuration, signals);
  } else {
    readRowMajor(buffer, baseOffset, numSignals, recordDuration, signals);
  }

  return signals;
}

function readColumnMajor(buffer, base, numSignals, recordDuration, signals) {
  const textDecoder = new TextDecoder('ascii');

  function readStr(offset, length) {
    return textDecoder.decode(new Uint8Array(buffer, offset, length)).trim();
  }

  function readInt(offset, length) {
    return parseInt(readStr(offset, length), 10);
  }

  function readDoubleSafe(offset, length) {
    const s = readStr(offset, length);
    if (!s) return 0;
    const v = parseFloat(s);
    return isNaN(v) ? 0 : v;
  }

  const n = numSignals;

  const labelsCol = base;
  const transducerCol = base + n * 16;
  const physDimCol = base + n * (16 + 80);
  const physMinCol = base + n * (16 + 80 + 8);
  const physMaxCol = base + n * (16 + 80 + 16);
  const digMinCol = base + n * (16 + 80 + 24);
  const digMaxCol = base + n * (16 + 80 + 32);
  const prefilterCol = base + n * (16 + 80 + 40);
  const sprCol = base + n * (16 + 80 + 40 + 80);

  for (let i = 0; i < n; i++) {
    const label = readStr(labelsCol + i * 16, 16);
    let physMin = readDoubleSafe(physMinCol + i * 8, 8);
    let physMax = readDoubleSafe(physMaxCol + i * 8, 8);
    let digMin = readDoubleSafe(digMinCol + i * 8, 8);
    let digMax = readDoubleSafe(digMaxCol + i * 8, 8);

    if (physMin > physMax) {
      const tmp = physMin;
      physMin = physMax;
      physMax = tmp;
      const dtmp = digMin;
      digMin = digMax;
      digMax = dtmp;
    }

    const spr = readInt(sprCol + i * 8, 8);

    signals.push({
      label,
      transducer: readStr(transducerCol + i * 80, 80),
      physDim: readStr(physDimCol + i * 8, 8),
      physMin,
      physMax,
      digMin,
      digMax,
      prefilter: readStr(prefilterCol + i * 80, 80),
      samplesPerRecord: spr || 0,
      sampleRate: spr > 0 ? spr / recordDuration : 0,
      isAnnotation: label === 'EDF Annotations',
    });
  }
}

function readRowMajor(buffer, base, numSignals, recordDuration, signals) {
  const textDecoder = new TextDecoder('ascii');

  function readStr(offset, length) {
    return textDecoder.decode(new Uint8Array(buffer, offset, length)).trim();
  }

  function readInt(offset, length) {
    return parseInt(readStr(offset, length), 10);
  }

  function readDouble(offset, length) {
    return parseFloat(readStr(offset, length));
  }

  for (let i = 0; i < numSignals; i++) {
    const offset = base + i * 256;
    const label = readStr(offset, 16);
    const isAnnotation = label === 'EDF Annotations';
    let physMin = readDouble(offset + 104, 8);
    let physMax = readDouble(offset + 112, 8);
    let digMin = readDouble(offset + 120, 8);
    let digMax = readDouble(offset + 128, 8);

    if (physMin > physMax) {
      const tmp = physMin;
      physMin = physMax;
      physMax = tmp;
      const dtmp = digMin;
      digMin = digMax;
      digMax = dtmp;
    }

    const spr = readInt(offset + 216, 8);

    signals.push({
      label,
      transducer: readStr(offset + 16, 80),
      physDim: readStr(offset + 96, 8),
      physMin,
      physMax,
      digMin,
      digMax,
      prefilter: readStr(offset + 136, 80),
      samplesPerRecord: spr || 0,
      sampleRate: spr > 0 ? spr / recordDuration : 0,
      isAnnotation,
    });
  }
}

function parseAnnotations(annotationSig) {
  const raw = annotationSig.rawBytes;
  const records = annotationSig.samplesPerRecord;
  const numRecs = raw.length / (records * 2);
  const annotations = [];

  for (let rec = 0; rec < numRecs; rec++) {
    const start = rec * records * 2;

    let pos = start;
    while (pos < start + records * 2) {
      if (pos >= raw.length) break;
      if (raw[pos] === 0 && raw[pos + 1] === 0) {
        pos += 2;
        continue;
      }

      let talEnd = pos;
      while (talEnd + 1 < raw.length) {
        if (raw[talEnd] === 0x14 && raw[talEnd + 1] === 0) {
          talEnd += 2;
          break;
        }
        talEnd++;
      }

      const talSlice = raw.slice(pos, talEnd);
      const decoder = new TextDecoder('ascii');
      let talStr;
      try {
        talStr = decoder.decode(talSlice);
      } catch {
        pos = talEnd;
        continue;
      }

      const parts = talStr.split('\x14');
      if (parts.length < 2) {
        pos = talEnd;
        continue;
      }

      const onsetDuration = parts[0].trim();
      const texts = parts.slice(1).filter((t) => t.trim());

      let onset, duration;
      const durSep = onsetDuration.indexOf('\x15');
      if (durSep >= 0) {
        onset = parseFloat(onsetDuration.substring(0, durSep));
        duration = parseFloat(onsetDuration.substring(durSep + 1));
      } else {
        onset = parseFloat(onsetDuration);
        duration = 0;
      }

      if (isNaN(onset)) {
        pos = talEnd;
        continue;
      }

      for (const text of texts) {
        const trimmed = text.trim();
        if (trimmed) {
          annotations.push({
            onset,
            duration,
            text: trimmed,
          });
        }
      }

      pos = talEnd;
    }
  }

  return annotations;
}

export function annotationsToTables(annotations) {
  const hypn = [];
  const arou = [];
  const resp = [];

  const HYPN_STAGES = {
    'sleep stage w': 'W',
    'sleep stage 1': '1',
    'sleep stage 2': '2',
    'sleep stage 3': '3',
    'sleep stage 4': '4',
    'sleep stage r': 'R',
    'sleep stage ?': '?',
    'stage w': 'W',
    'stage 1': '1',
    'stage 2': '2',
    'stage 3': '3',
    'stage 4': '4',
    'stage r': 'R',
  };

  for (const a of annotations) {
    const lower = a.text.toLowerCase();

    const stage = HYPN_STAGES[lower];
    if (stage) {
      const sampleNum = Math.round(a.onset);
      hypn.push({
        Time: formatTime(a.onset),
        'Sample#': sampleNum,
        Type: '',
        Sub: 0,
        Chan: 0,
        Num: 0,
        Aux: stage,
      });
      continue;
    }

    if (lower.includes('arousal')) {
      const sampleNum = Math.round(a.onset);
      arou.push({
        Time: formatTime(a.onset),
        'Sample#': sampleNum,
        Type: '',
        Sub: 0,
        Chan: 0,
        Num: 0,
        Aux: 'Arousal',
        Duration: formatDuration(a.duration),
      });
      continue;
    }

    if (lower.includes('apnea') || lower.includes('hypopnea')) {
      const sampleNum = Math.round(a.onset);
      resp.push({
        Time: formatTime(a.onset),
        'Sample#': sampleNum,
        Type: '',
        Sub: 0,
        Chan: 0,
        Num: 0,
        Aux: a.text.replace(/\s+/g, ' '),
        Duration: formatDuration(a.duration),
      });
    }
  }

  return { hypn, arou, resp };
}

function formatTime(seconds) {
  const totalSec = Math.floor(seconds);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return `[${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.000]`;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const totalSec = Math.floor(seconds);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const ds = Math.round((seconds - Math.floor(seconds)) * 10);
  return `${mm}:${String(ss).padStart(2, '0')}.${ds}`;
}
