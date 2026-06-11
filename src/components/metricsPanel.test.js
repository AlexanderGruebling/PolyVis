import { describe, it, expect, vi, beforeEach } from 'vitest';
import { severityLabel, severityColor } from './metricsPanel.js';

describe('severityLabel', () => {
  it('returns "normal" for AHI < 5', () => {
    expect(severityLabel(0)).toBe('normal');
    expect(severityLabel(4.9)).toBe('normal');
  });

  it('returns "mild" for AHI 5–14.9', () => {
    expect(severityLabel(5)).toBe('mild');
    expect(severityLabel(14.9)).toBe('mild');
  });

  it('returns "moderate" for AHI 15–29.9', () => {
    expect(severityLabel(15)).toBe('moderate');
    expect(severityLabel(29.9)).toBe('moderate');
  });

  it('returns "severe" for AHI ≥ 30', () => {
    expect(severityLabel(30)).toBe('severe');
    expect(severityLabel(100)).toBe('severe');
  });
});

describe('severityColor', () => {
  it('returns green for AHI < 5', () => {
    expect(severityColor(0)).toBe('#3fb950');
    expect(severityColor(4.9)).toBe('#3fb950');
  });

  it('returns yellow for AHI 5–14.9', () => {
    expect(severityColor(5)).toBe('#d29922');
    expect(severityColor(14.9)).toBe('#d29922');
  });

  it('returns orange for AHI 15–29.9', () => {
    expect(severityColor(15)).toBe('#f0883e');
    expect(severityColor(29.9)).toBe('#f0883e');
  });

  it('returns red for AHI ≥ 30', () => {
    expect(severityColor(30)).toBe('#f04040');
    expect(severityColor(100)).toBe('#f04040');
  });
});

describe('getDesaturationIntervals', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns empty for a flat SaO₂ trace', async () => {
    const mod = await import('./metricsPanel.js');
    const mockQ = vi
      .fn()
      .mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ time: i, SaO2: 97 })),
      );
    expect(await mod.getDesaturationIntervals(mockQ)).toEqual([]);
  });

  it('detects a desaturation when SaO₂ drops ≥3 % from baseline', async () => {
    const mod = await import('./metricsPanel.js');
    const data = [
      ...Array.from({ length: 10 }, (_, i) => ({ time: i, SaO2: 100 })),
      ...Array.from({ length: 10 }, (_, i) => ({ time: i + 10, SaO2: 90 })),
    ];
    const mockQ = vi.fn().mockResolvedValue(data);
    const intervals = await mod.getDesaturationIntervals(mockQ);
    expect(intervals.length).toBe(1);
    expect(intervals[0].depth).toBeGreaterThanOrEqual(3);
  });

  it('detects multiple separate desaturations', async () => {
    const mod = await import('./metricsPanel.js');
    const data = [
      ...Array.from({ length: 10 }, (_, i) => ({ time: i, SaO2: 100 })),
      ...Array.from({ length: 5 }, (_, i) => ({ time: i + 10, SaO2: 90 })),
      ...Array.from({ length: 5 }, (_, i) => ({ time: i + 15, SaO2: 100 })),
      ...Array.from({ length: 5 }, (_, i) => ({ time: i + 20, SaO2: 91 })),
    ];
    const mockQ = vi.fn().mockResolvedValue(data);
    const intervals = await mod.getDesaturationIntervals(mockQ);
    expect(intervals.length).toBe(2);
  });

  it('ignores drops smaller than 3 %', async () => {
    const mod = await import('./metricsPanel.js');
    const data = [
      ...Array.from({ length: 10 }, (_, i) => ({ time: i, SaO2: 100 })),
      ...Array.from({ length: 10 }, (_, i) => ({ time: i + 10, SaO2: 98 })),
    ];
    const mockQ = vi.fn().mockResolvedValue(data);
    expect(await mod.getDesaturationIntervals(mockQ)).toEqual([]);
  });
});

describe('getMetrics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('computes AHI, ODI and SaO₂ statistics', async () => {
    const mod = await import('./metricsPanel.js');
    const mockQ = vi
      .fn()
      .mockResolvedValueOnce([{ cnt: 480 }])
      .mockResolvedValueOnce([{ cnt: 240 }])
      .mockResolvedValueOnce([{ m: 85, a: 94.5 }])
      .mockResolvedValueOnce([{ v: 3.1 }])
      .mockResolvedValueOnce([{ v: 7.2 }])
      .mockResolvedValueOnce(
        Array.from({ length: 20 }, (_, i) => ({ time: i, SaO2: 100 })),
      );

    const metrics = await mod.getMetrics(mockQ);
    expect(metrics.sleepHours).toBeCloseTo(4, 1);
    expect(metrics.ahi).toBeCloseTo(60, 1);
    expect(metrics.odi).toBe(0);
    expect(metrics.o2Desats).toBe(0);
    expect(metrics.respCnt).toBe(240);
    expect(metrics.minSaO2).toBeCloseTo(85, 1);
    expect(metrics.avgSaO2).toBeCloseTo(94.5, 1);
    expect(metrics.pctBelow88).toBeCloseTo(3.1, 1);
    expect(metrics.pctBelow90).toBeCloseTo(7.2, 1);
  });

  it('returns zero AHI when no sleep epochs are recorded', async () => {
    const mod = await import('./metricsPanel.js');
    const mockQ = vi
      .fn()
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 100 }])
      .mockResolvedValueOnce([{ m: 90, a: 97 }])
      .mockResolvedValueOnce([{ v: 0 }])
      .mockResolvedValueOnce([{ v: 0 }])
      .mockResolvedValueOnce(
        Array.from({ length: 20 }, (_, i) => ({ time: i, SaO2: 100 })),
      );

    const metrics = await mod.getMetrics(mockQ);
    expect(metrics.sleepHours).toBeCloseTo(0, 1);
    expect(metrics.ahi).toBeCloseTo(0, 1);
    expect(metrics.odi).toBeCloseTo(0, 1);
  });
});
