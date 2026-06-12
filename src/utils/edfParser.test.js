import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseEDF, annotationsToTables } from './edfParser.js';

const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const edfPath = resolve(projectRoot, 'public/shhs1-200001.edf');

let result;

beforeAll(() => {
  const buf = readFileSync(edfPath);
  result = parseEDF(buf.buffer);
}, 30000);

describe('parseEDF', () => {
  it('parses main header', () => {
    expect(result.numSignals).toBe(14);
    expect(result.numRecords).toBe(32520);
    expect(result.recordDuration).toBe(1);
    expect(result.startDate).toBe('01.01.85');
    expect(result.startTime).toBe('22.00.00');
    expect(result.annotations).toEqual([]);
  });

  it('parses all signal headers with correct labels', () => {
    const labels = result.signals.map((s) => s.label);
    expect(labels).toEqual([
      'SaO2',
      'H.R.',
      'EEG(sec)',
      'ECG',
      'EMG',
      'EOG(L)',
      'EOG(R)',
      'EEG',
      'THOR RES',
      'ABDO RES',
      'POSITION',
      'LIGHT',
      'NEW AIR',
      'OX stat',
    ]);
  });

  it('reads sample rates correctly', () => {
    const rates = result.signals.map((s) => s.sampleRate);
    expect(rates).toEqual([1, 1, 125, 125, 125, 50, 50, 125, 10, 10, 1, 1, 10, 1]);
  });

  it('reads physical dimensions', () => {
    const dims = result.signals.map((s) => s.physDim);
    expect(dims).toEqual(['', '', 'uV', 'mV', 'uV', 'uV', 'uV', 'uV', '', '', '', '', 'uV', '']);
  });

  it('produces SaO2 values in physiological range', () => {
    const saO2 = result.signals.find((s) => s.label === 'SaO2');
    expect(saO2.samples.length).toBe(32520);
    const vals = Array.from(saO2.samples);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(100);
    expect(mean).toBeGreaterThan(50);
  });

  it('produces EEG values in typical range', () => {
    const eeg = result.signals.find((s) => s.label === 'EEG');
    expect(eeg.samples.length).toBe(4065000);
    const vals = Array.from(eeg.samples.slice(1000, 2000));
    for (const v of vals) {
      expect(Math.abs(v)).toBeLessThan(200);
    }
  });

  it('handles THOR RES swapped phys range', () => {
    const thor = result.signals.find((s) => s.label === 'THOR RES');
    expect(thor.physMin).toBe(-1);
    expect(thor.physMax).toBe(1);
    const vals = Array.from(thor.samples.slice(0, 100));
    expect(Math.min(...vals)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...vals)).toBeLessThanOrEqual(1);
  });

  it('reads all signals without NaN values', () => {
    for (const sig of result.signals) {
      expect(sig.samples.length).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(sig.samples.length, 100); i++) {
        expect(Number.isFinite(sig.samples[i])).toBe(true);
      }
    }
  });
});

describe('annotationsToTables', () => {
  it('returns empty tables for empty annotations', () => {
    const { hypn, arou, resp } = annotationsToTables([]);
    expect(hypn).toEqual([]);
    expect(arou).toEqual([]);
    expect(resp).toEqual([]);
  });

  it('parses sleep stage annotations', () => {
    const annotations = [
      { onset: 0, duration: 0, text: 'Sleep stage W' },
      { onset: 30, duration: 0, text: 'Sleep stage 2' },
      { onset: 60, duration: 0, text: 'Sleep stage R' },
    ];
    const { hypn, arou, resp } = annotationsToTables(annotations);
    expect(hypn).toHaveLength(3);
    expect(hypn[0].Aux).toBe('W');
    expect(hypn[1].Aux).toBe('2');
    expect(hypn[2].Aux).toBe('R');
    expect(arou).toEqual([]);
    expect(resp).toEqual([]);
  });

  it('parses arousal and respiratory events', () => {
    const annotations = [
      { onset: 100, duration: 5, text: 'Arousal' },
      { onset: 200, duration: 15, text: 'Obstructive apnea' },
    ];
    const { hypn, arou, resp } = annotationsToTables(annotations);
    expect(arou).toHaveLength(1);
    expect(arou[0].Aux).toBe('Arousal');
    expect(resp).toHaveLength(1);
    expect(resp[0].Aux).toBe('Obstructive apnea');
  });
});
