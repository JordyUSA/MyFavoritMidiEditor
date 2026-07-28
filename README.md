# MyFavoritMidiEditor

An advanced MIDI editor and music creator that runs entirely in your browser — no installs, no backend, no accounts. Import MIDI files, arrange them automatically by instrument, edit notes on a piano roll or a real music staff, mix with effects, and export to MIDI, MusicXML, or WAV.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL (Vite's default is `http://localhost:5173`). Everything runs client-side; nothing is uploaded anywhere.

```bash
npm run build      # production build to dist/
npm run typecheck  # TypeScript project-wide check
npm run lint       # ESLint
```

## Feature tour

### Two zoom levels
- **Overview** — one horizontal lane per **Waveform** (a named group of tracks, usually one per imported MIDI file or preset). Drag a lane left/right to shift when it starts playing; click it to expand and see its instrument tracks inline, right there in the lane.
- **Instrument view** — opens a single track's full editor: piano roll ("Bars") or staff notation ("Notation"), plus a velocity lane, at whatever zoom level you want.

### Import & auto-arrange
Drop in one or more `.mid`/`.midi` files (**Import MIDI**, multi-select supported). Each file becomes its own Waveform. Instrument separation is automatic — the parser (`@tonejs/midi`) already splits any MIDI file (format 0 or 1, single-track-multi-channel or not) into one logical track per instrument/channel, and each becomes its own Track with a sensible name, GM instrument, and color.

**Tempo detection**: the importer reads the file's own tempo/time-signature meta-events and shows you what it found — an explicit marking, a guessed default (120 BPM/4/4 when the file has none), or "starts at X, changes N times" for files with tempo automation. **Confirm** applies that tempo/signature to the project starting at the new waveform's position. **Deny** still imports every note at its correct musical position (tick-based positions are tempo-independent), but leaves the project's tempo untouched and flags the waveform's grid as "unconfirmed" in the UI.

### Editing notes ("bars")
- Click-drag on empty space to draw a note; drag its left/right edge to resize.
- Drag a note to move it (pitch + time); shift-click to multi-select, drag a selection-marquee with the Select tool.
- Snap-to-grid with a dedicated dropdown (off, whole down to 1/32, plus 1/8 and 1/16 triplets).
- Velocity lane underneath — drag any bar up/down; multi-selected notes move together.
- Copy/paste, quantize, transpose (↑/↓, shift for octaves), delete — all with keyboard shortcuts and full undo/redo.
- Space bar toggles play/pause from inside the editor.

### Editing notes ("musical notes" / staff notation)
Flip a track to **Notation** and it renders as real staff notation (VexFlow) — clefs, time signature, beams, ties across barlines, dotted rhythms — generated from the exact same note data as the piano roll, so switching views never loses anything. To write by ear: pick a note duration (whole → 16th, optional dot) from the palette, "arm" a pitch (via the pitch field or **Hear** to preview it), then click a measure to drop that note in at the nearest beat; shift-click removes whatever's there. For free-form dragging/resizing, flip back to Bars — both views edit the same notes.

### Playback & mixing
A small per-family synth engine (built on Tone.js) covers all 128 General MIDI instruments plus a synthesized GM drum kit — no sample downloads, works fully offline. Each track gets its own instrument, effect chain, volume/pan/mute/solo. Loop region, metronome, master volume, and a live-updating transport (bar:beat + mm:ss) round out the transport bar.

**Effects**: reverb, delay, chorus, distortion, 3-band EQ, compressor, phaser, bitcrusher, tremolo, and auto-filter — stack as many as you want per track, tweak wet mix and parameters live while playing.

### Presets
- **Beat presets** (🥁): ~19 drum patterns across rock, pop, hip-hop/boom-bap, trap, house, techno, disco, funk, reggae, jazz swing, bossa nova, blues shuffle, ballad, metal, drum & bass, dubstep, afrobeat, waltz, punk, plus a tom fill — each inserts as a new Waveform with a ready-to-go drum track (loop count configurable).
- **Song presets** (🎼): ten chord-progression templates (pop I–V–vi–IV, '50s I–vi–IV–V, 12-bar blues, jazz ii–V–I, Andalusian cadence, Canon progression, and more) built from actual music theory (diatonic triads from roman numerals), each inserting a Chords track, a Bass track, and — where it makes sense — a matching drum beat.

### Import/export/save formats
| Format | Direction | Notes |
|---|---|---|
| Standard MIDI File (`.mid`) | import & export | Full round-trip; auto-arranges on import |
| MusicXML 4.0 (`.musicxml`) | export | The open, standard notation-interchange format read by MuseScore, Finale, Sibelius, LilyPond, etc. Shares its measure/tie/rhythm model with the in-app Notation view |
| WAV (`.wav`) | export | Rendered offline (faster than real time) through the same instrument/effects graph used for playback |
| `.mfme` (this app's own format) | save & load | A versioned, human-readable JSON document with the *entire* project — waveforms, tracks, notes, tempo map, effects, everything — for lossless save/reload. See [File format](#the-mfme-file-format) below |

## Architecture

```
src/
  state/        Project data model (types.ts), factories, and two Zustand
                 stores: projectStore (the document + undo/redo history)
                 and uiStore (view/zoom/selection/playback — not persisted)
  audio/         Tone.js engine: per-GM-family synth patches, a synthesized
                 drum kit, the effects chain, and the AudioEngine class that
                 (re)builds the live graph and can render offline to WAV
  midi/          Import (parse + auto-arrange + tempo detection) and export
                 (project -> Standard MIDI File), via @tonejs/midi
  musicxml/      MusicXML 4.0 writer, built on the shared notation model
  notation/      The measure/voice/tie/rhythm model shared by the MusicXML
                 exporter and the in-app VexFlow staff view, so what you see
                 always matches what gets exported
  fileformat/    The .mfme save/load format
  presets/       Beat presets (pattern DSL) and song presets (roman-numeral
                 chord theory)
  components/    OverviewView, InstrumentView (piano roll + notation),
                 Toolbar, Presets panels, and shared UI (modals, effects
                 panel, beat ruler, playhead)
```

Everything is beat-based internally (1 beat = 1 quarter note), converted to real seconds only at the edges (audio scheduling, MIDI tick export) via the project's tempo map — so a single project can contain tempo changes without breaking sync between tracks.

### The `.mfme` file format

A `.mfme` file is plain JSON:

```json
{
  "magic": "MyFavoritMidiEditor-ProjectFile",
  "savedAt": "2026-01-01T00:00:00.000Z",
  "appVersion": "0.1.0",
  "project": {
    "formatVersion": 1,
    "tempoMap": [{ "beat": 0, "bpm": 120 }],
    "timeSignatureMap": [{ "beat": 0, "numerator": 4, "denominator": 4 }],
    "waveforms": [
      {
        "name": "My Song",
        "startOffset": 0,
        "tracks": [
          {
            "name": "Piano",
            "instrument": { "program": 0, "isDrumKit": false },
            "notes": [{ "pitch": 60, "start": 0, "duration": 1, "velocity": 100 }],
            "effects": [{ "type": "reverb", "wet": 0.4, "params": { "decay": 2.5 } }]
          }
        ]
      }
    ]
  }
}
```

It's designed to be diffable, greppable, and forward-compatible (`formatVersion` gates future migrations). "Open .mfme" round-trips it exactly.

## Known limitations (being upfront about scope)

This is a big feature set for one app, so a few corners are intentionally simplified rather than half-built:

- **Sound engine** is synthesized (Tone.js oscillators/envelopes tuned per GM instrument family), not sampled — it's fully offline and dependency-free, but won't sound like a real recorded piano/orchestra. `InstrumentSpec.source` already has a `'soundfont'` option reserved for a future sample-based engine.
- **MusicXML/notation** always writes C major/A minor key signatures (no key detection), spells pitches with sharps only, and notates percussion with regular noteheads rather than an unpitched percussion staff. Non-grid durations snap to the nearest 64th note. Up to 4 simultaneous overlapping voices per part are notated; anything beyond that is dropped from notation only (MIDI export is unaffected).
- **Notation-view note entry** is duration-palette-plus-click (like step-time entry in Finale/Sibelius/MuseScore), not freehand pixel dragging on the staff — freehand move/resize lives in Bars view, which edits the exact same notes.
- **A project has one tempo/time-signature map**, shared by every waveform (tempo *does* support changing over time via markers — e.g. confirming an imported file's tempo inserts a marker at that waveform's start beat — but there's no per-waveform-independent tempo).
- Large/long projects render their beat ruler as real DOM elements rather than a virtualized canvas, so extremely long timelines (thousands of bars) will get slow. Everything up to normal song lengths is snappy.

## Tech stack

React 18 + TypeScript + Vite, Zustand for state, Tone.js for audio, `@tonejs/midi` for MIDI I/O, VexFlow for notation rendering (lazy-loaded only when you open Notation view).
