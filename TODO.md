# PolyVis — TODO

## Visualization Enhancements

- [ ] **SpO₂ histogram** — small distribution chart with 88% / 90% thresholds marked, standard in sleep reports
- [ ] **Event density by sleep stage** — grouped bar chart showing respiratory/arousal event counts per stage (REM-predominant apnea is a key clinical finding)
- [ ] **Timeline strip** — compact horizontal strip covering the full night with colored event ticks (apneas, hypopneas, desats, arousals) below the hypnogram
- [ ] **Respiratory event context viewer** — clicking an event auto-zooms to a 90-second window centered on it, mimicking commercial PSG software
- [ ] **Report summary card** — print-friendly overlay with hypnogram, metrics grid, and patient info; "Export PDF" button
- [ ] **AHI severity color badge** — colored dot next to AHI: green (<5), yellow (5–15), orange (15–30), red (≥30)

## Interaction

- [ ] **Range-selection brush on hypnogram** — drag to select a window that zooms the signal plots (was implemented then reverted; needs to work without also brushing the hypnogram itself)
- [x] **Keyboard shortcuts** — `R`/`Esc` resets zoom, `←`/`→` pans by 25% of current window ✓

## Code Quality

- [x] **Remove unused `d3` dependency** — listed in `package.json` but no longer imported anywhere ✓
- [x] **Chunk size warning** — `@uwdata` packages extracted into `vendor` chunk via `manualChunks` ✓
- [x] **Hypnogram axis label** — now shows "HH:MM" instead of the auto-generated field name ✓

## Polish

- [ ] **Tooltip on desaturation bands** — hovering a pink band shows the max drop depth (e.g. "↓4.2%")
