export type ScaleMode = 'major' | 'minor';
export type ChordQuality = 'maj' | 'min' | 'dim';

export const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const TRIAD_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

interface RomanEntry {
  degree: number; // 0-indexed scale degree
  quality: ChordQuality;
}

/** Roman numerals we support across song presets, for both major and minor keys. */
const ROMAN_TABLE: Record<string, RomanEntry> = {
  I: { degree: 0, quality: 'maj' },
  ii: { degree: 1, quality: 'min' },
  iii: { degree: 2, quality: 'min' },
  IV: { degree: 3, quality: 'maj' },
  V: { degree: 4, quality: 'maj' },
  vi: { degree: 5, quality: 'min' },
  'vii°': { degree: 6, quality: 'dim' },
  i: { degree: 0, quality: 'min' },
  'ii°': { degree: 1, quality: 'dim' },
  III: { degree: 2, quality: 'maj' },
  iv: { degree: 3, quality: 'min' },
  v: { degree: 4, quality: 'min' },
  VI: { degree: 5, quality: 'maj' },
  VII: { degree: 6, quality: 'maj' },
};

/** Builds the MIDI pitches (root position triad) for a roman-numeral chord in a given key. */
export function romanToTriad(roman: string, keyRootMidi: number, mode: ScaleMode): number[] {
  const entry = ROMAN_TABLE[roman];
  if (!entry) return [keyRootMidi, keyRootMidi + 4, keyRootMidi + 7];
  const scale = SCALE_INTERVALS[mode];
  const chordRoot = keyRootMidi + scale[entry.degree % 7];
  return TRIAD_INTERVALS[entry.quality].map((iv) => chordRoot + iv);
}

export const NOTE_NAME_TO_PITCH_CLASS: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

export function keyRootMidi(keyName: string, octave = 4): number {
  const pc = NOTE_NAME_TO_PITCH_CLASS[keyName] ?? 0;
  return (octave + 1) * 12 + pc;
}
