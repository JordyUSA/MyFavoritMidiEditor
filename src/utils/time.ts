import type { TempoMarker, TimeSignatureMarker } from '@/state/types';

/** Ensures a tempo map always has a marker at beat 0 so lookups never fail. */
export function normalizeTempoMap(map: TempoMarker[]): TempoMarker[] {
  const sorted = [...map].sort((a, b) => a.beat - b.beat);
  if (sorted.length === 0 || sorted[0].beat > 0) {
    sorted.unshift({ beat: 0, bpm: sorted[0]?.bpm ?? 120 });
  }
  return sorted;
}

/** Converts an absolute project beat position to seconds, honoring tempo changes. */
export function beatsToSeconds(beat: number, tempoMap: TempoMarker[]): number {
  const map = normalizeTempoMap(tempoMap);
  let seconds = 0;
  for (let i = 0; i < map.length; i++) {
    const segStart = map[i].beat;
    const segEnd = i + 1 < map.length ? map[i + 1].beat : Infinity;
    const bpm = map[i].bpm;
    const secondsPerBeat = 60 / bpm;
    if (beat <= segStart) break;
    const segBeats = Math.min(beat, segEnd) - segStart;
    seconds += segBeats * secondsPerBeat;
    if (beat <= segEnd) break;
  }
  return seconds;
}

export function secondsToBeats(seconds: number, tempoMap: TempoMarker[]): number {
  const map = normalizeTempoMap(tempoMap);
  let remaining = seconds;
  let beat = 0;
  for (let i = 0; i < map.length; i++) {
    const segStart = map[i].beat;
    const segEndBeat = i + 1 < map.length ? map[i + 1].beat : Infinity;
    const bpm = map[i].bpm;
    const secondsPerBeat = 60 / bpm;
    const segDurationSeconds = (segEndBeat - segStart) * secondsPerBeat;
    if (remaining <= segDurationSeconds || segEndBeat === Infinity) {
      beat = segStart + remaining / secondsPerBeat;
      return beat;
    }
    remaining -= segDurationSeconds;
  }
  return beat;
}

export function bpmAtBeat(beat: number, tempoMap: TempoMarker[]): number {
  const map = normalizeTempoMap(tempoMap);
  let current = map[0].bpm;
  for (const marker of map) {
    if (marker.beat > beat) break;
    current = marker.bpm;
  }
  return current;
}

export function timeSignatureAtBeat(
  beat: number,
  map: TimeSignatureMarker[],
): TimeSignatureMarker {
  const sorted = [...map].sort((a, b) => a.beat - b.beat);
  let current: TimeSignatureMarker = sorted[0] ?? { beat: 0, numerator: 4, denominator: 4 };
  for (const marker of sorted) {
    if (marker.beat > beat) break;
    current = marker;
  }
  return current;
}

export function beatsPerBar(sig: TimeSignatureMarker): number {
  return sig.numerator * (4 / sig.denominator);
}

/** Snaps a beat value to the nearest multiple of `gridBeats` (0 = no snap). */
export function snapBeat(beat: number, gridBeats: number): number {
  if (!gridBeats || gridBeats <= 0) return beat;
  return Math.round(beat / gridBeats) * gridBeats;
}

export const SNAP_OPTIONS: { label: string; beats: number }[] = [
  { label: 'Off', beats: 0 },
  { label: '1/1', beats: 4 },
  { label: '1/2', beats: 2 },
  { label: '1/4', beats: 1 },
  { label: '1/8', beats: 0.5 },
  { label: '1/16', beats: 0.25 },
  { label: '1/32', beats: 0.125 },
  { label: '1/8T', beats: 1 / 3 },
  { label: '1/16T', beats: 1 / 6 },
];
