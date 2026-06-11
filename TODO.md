# PolyVis — TODO

> **Migrated to GitHub Issues:** All open items below have been moved to https://github.com/AlexanderGruebling/PolyVis/issues — see `AGENTS.md` for the issue-to-title mapping.

## Visualization Enhancements

- [x] **SpO₂ histogram** — small distribution chart with 88% / 90% thresholds marked, standard in sleep reports ✓
- [x] **Event density by sleep stage** — grouped bar chart showing respiratory/arousal event counts per stage (REM-predominant apnea is a key clinical finding) ✓
- [x] **Timeline strip** — compact horizontal strip covering the full night with colored event ticks (apneas, hypopneas, desats, arousals) below the hypnogram ✓
- [ ] **Respiratory event context viewer** — clicking an event auto-zooms to a 90-second window centered on it, mimicking commercial PSG software
- [ ] **Report summary card** — print-friendly overlay with hypnogram, metrics grid, and patient info; "Export PDF" button
- [x] **AHI severity color badge** — colored dot next to AHI: green (<5), yellow (5–15), orange (15–30), red (≥30) ✓
- [ ] **Scatter: desaturation severity by sleep stage** — each desat as a point (x=duration, y=nadir SpO₂), colored by sleep stage (N1/N2/N3/REM) — reveals whether REM-related events are more severe
- [ ] **Heart rate trend overlay** — smoothed PR (pulse rate) trace plotted alongside or below SpO₂ to show autonomic response to events

## Interaction

- [ ] **Hypnogram brush → analysis page navigation** — drag-select a range on the hypnogram (using `selectInterval` backed by `params.sampleDomain`), analysis page auto-updates to show signal traces/events in that window. The hypnogram itself stays at full-night view — it's a top-level navigation tool, not a zoom target.
- [ ] **Click timeline event → navigate to analysis** — clicking a desat/apnea/arousal tick in the timeline strip jumps the analysis page to a window centered on that event
- [ ] **Event detail hover card** — when hovering over the hypnogram (via existing `params.hypnPoint`), show a floating HTML card with: sleep stage at cursor, nearest desaturation depth, respiratory event count in that epoch. Also applies to hovering desaturation bands on the analysis page.
- [x] **Keyboard shortcuts** — `R`/`Esc` resets zoom, `←`/`→` pans by 25% of current window ✓

## Advanced Analytics

- [ ] **Event-locked SpO₂ averaging** — for all desaturations of a given type, extract the SpO₂ waveform from −30s to +60s around onset and overlay them. Dark line for the average, lighter lines for individual events. Standard in sleep research for characterizing event physiology.

## Code Quality

- [x] **Remove unused `d3` dependency** — listed in `package.json` but no longer imported anywhere ✓
- [x] **Chunk size warning** — `@uwdata` packages extracted into `vendor` chunk via `manualChunks` ✓
- [x] **Hypnogram axis label** — now shows "HH:MM" instead of the auto-generated field name ✓
