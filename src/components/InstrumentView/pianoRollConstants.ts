import { GM_DRUM_NOTES } from '@/utils/gmInstruments';

export const PITCH_MIN = 21; // A0
export const PITCH_MAX = 108; // C8
export const NOTE_ROW_HEIGHT = 14;
export const KEYS_WIDTH = 64;

export function isBlackKey(pitch: number): boolean {
  return [1, 3, 6, 8, 10].includes(pitch % 12);
}

/** The ordered (high-to-low) list of pitches shown as rows, given the track kind. */
export function visiblePitches(isDrumKit: boolean): number[] {
  if (isDrumKit) return [...GM_DRUM_NOTES].map((d) => d.pitch).sort((a, b) => b - a);
  const out: number[] = [];
  for (let p = PITCH_MAX; p >= PITCH_MIN; p--) out.push(p);
  return out;
}

export function rowIndexForPitch(pitch: number, pitches: number[]): number {
  const idx = pitches.indexOf(pitch);
  return idx === -1 ? 0 : idx;
}

export function pitchForRowIndex(rowIndex: number, pitches: number[]): number {
  const clamped = Math.max(0, Math.min(pitches.length - 1, rowIndex));
  return pitches[clamped];
}
