const LABEL_MAP = [
  { patterns: [/^sa/i, /^spo2/i, /^oxysat/i], name: 'SaO2' },
  { patterns: [/^ecg/i, /^ekg/i], name: 'ECG' },
  { patterns: [/^eeg/i], name: 'EEG' },
  { patterns: [/^eog.*l/i], name: 'EOG(L)' },
  { patterns: [/^eog.*r/i], name: 'EOG(R)' },
  { patterns: [/^emg/i], name: 'EMG' },
  { patterns: [/^thor/i, /^chest/i], name: 'THOR RES' },
  { patterns: [/^abdo/i], name: 'ABDO RES' },
  {
    patterns: [/^airflow/i, /^nasal/i, /^flow/i, /^new air/i],
    name: 'AIRFLOW',
  },
  { patterns: [/^pr/i, /^pulse/i], name: 'PR' },
  { patterns: [/^eeg\(sec\)/i], name: 'EEG(sec)' },
];

export function mapSignalLabel(edfLabel) {
  const trimmed = edfLabel.trim();
  for (const entry of LABEL_MAP) {
    if (entry.patterns.some((p) => p.test(trimmed))) {
      return entry.name;
    }
  }
  return `EXT_${trimmed.replace(/[^a-zA-Z0-9 ()_-]/g, '_')}`;
}

export function isExtraSignal(channel) {
  return channel.startsWith('EXT_');
}
