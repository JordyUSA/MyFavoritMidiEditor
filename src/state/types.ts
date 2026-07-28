/**
 * Core data model for MyFavoritMidiEditor.
 *
 * Canonical time unit is the "beat" (= one quarter note), a floating point
 * number counted from the start of a Waveform (for notes) or the start of
 * the Project (for tempo/time-signature maps and waveform offsets). Using a
 * musical unit instead of raw seconds is what lets tracks stay in sync with
 * tempo changes and lets note durations map cleanly onto notation.
 */

export type ID = string;

/** Standard duration names, expressed in beats (quarter note = 1). */
export const DURATION_BEATS = {
  whole: 4,
  dottedHalf: 3,
  half: 2,
  dottedQuarter: 1.5,
  quarter: 1,
  dottedEighth: 0.75,
  eighth: 0.5,
  tripletEighth: 1 / 3,
  sixteenth: 0.25,
  tripletSixteenth: 1 / 6,
  thirtySecond: 0.125,
} as const;

export type DurationName = keyof typeof DURATION_BEATS;

export interface TempoMarker {
  /** Absolute project beat this tempo takes effect at. */
  beat: number;
  bpm: number;
}

export interface TimeSignatureMarker {
  beat: number;
  numerator: number;
  denominator: number;
}

/** A single note event (a "bar" in piano-roll / waveform-sheet terminology). */
export interface Note {
  id: ID;
  /** MIDI pitch, 0-127 (60 = middle C / C4). */
  pitch: number;
  /** Start time in beats, relative to the owning Track's Waveform. */
  start: number;
  /** Duration in beats. Always > 0. */
  duration: number;
  /** 1-127. */
  velocity: number;
  /** Optional lock so auto-quantize/humanize tools skip this note. */
  locked?: boolean;
}

export type EffectType =
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'distortion'
  | 'eq3'
  | 'compressor'
  | 'phaser'
  | 'bitcrusher'
  | 'tremolo'
  | 'autoFilter';

export interface EffectInstance {
  id: ID;
  type: EffectType;
  enabled: boolean;
  /** 0..1 wet/dry mix, where applicable. */
  wet: number;
  params: Record<string, number>;
}

export type InstrumentSource = 'synth' | 'soundfont';

export interface InstrumentSpec {
  /** General MIDI program number, 0-127. Ignored for the drum kit track. */
  program: number;
  /** True if this track is the GM percussion kit (MIDI channel 10). */
  isDrumKit: boolean;
  /** 'soundfont' = real sampled instruments (default); 'synth' = fast, fully offline oscillators. */
  source: InstrumentSource;
  /** Which real drum machine sample kit to use when isDrumKit && source==='soundfont'. */
  drumKitName?: string;
  /** Human label, e.g. "Acoustic Grand Piano". */
  name: string;
}

export type NoteViewMode = 'bars' | 'notation';

export interface Track {
  id: ID;
  name: string;
  instrument: InstrumentSpec;
  color: string;
  notes: Note[];
  effects: EffectInstance[];
  volume: number; // dB, -60..6
  pan: number; // -1..1
  muted: boolean;
  solo: boolean;
  viewMode: NoteViewMode;
  /** Preferred MIDI channel on export; 9 (0-indexed) reserved for drums. */
  midiChannel: number;
}

/**
 * A Waveform is the "wide view" container: one lane in the overview,
 * holding all the instrument Tracks that came from a single import (or that
 * the user grouped together), and an independent start offset so the whole
 * group can be slid along the timeline.
 */
export interface Waveform {
  id: ID;
  name: string;
  color: string;
  /** Offset in beats from project start; dragging in overview changes this. */
  startOffset: number;
  tracks: Track[];
  collapsed: boolean;
  muted: boolean;
  /** Set when this waveform came from an imported MIDI file. */
  importInfo?: {
    sourceFileName: string;
    detectedBpm: number;
    detectedTimeSignature: [number, number];
    tempoConfidence: 'explicit' | 'default' | 'variable';
    /** true = user confirmed detected timing, false = user denied it (grid shown as advisory only). */
    timingConfirmed: boolean;
  };
}

export interface ProjectMeta {
  sourceFileName?: string;
}

export interface Project {
  formatVersion: 1;
  id: ID;
  name: string;
  createdAt: string;
  modifiedAt: string;
  tempoMap: TempoMarker[];
  timeSignatureMap: TimeSignatureMarker[];
  masterVolume: number;
  swing: number; // 0..1
  waveforms: Waveform[];
  meta?: ProjectMeta;
}
