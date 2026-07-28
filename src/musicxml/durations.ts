/** Divisions (MusicXML ticks-per-quarter-note) used throughout the exporter. */
export const XML_DIVISIONS = 48;
/** Smallest notatable unit: a 64th note. Every position/duration is rounded to a multiple of this. */
export const ATOMIC_DIVISIONS = 3;

export interface NoteValue {
  div: number;
  type: string;
  dots: number;
}

/** Standard note values, descending, expressed in /divisions/ at XML_DIVISIONS=48. */
const NOTE_VALUES: NoteValue[] = [
  { div: 192, type: 'whole', dots: 0 },
  { div: 144, type: 'half', dots: 1 },
  { div: 96, type: 'half', dots: 0 },
  { div: 72, type: 'quarter', dots: 1 },
  { div: 48, type: 'quarter', dots: 0 },
  { div: 36, type: 'eighth', dots: 1 },
  { div: 24, type: 'eighth', dots: 0 },
  { div: 18, type: '16th', dots: 1 },
  { div: 12, type: '16th', dots: 0 },
  { div: 9, type: '32nd', dots: 1 },
  { div: 6, type: '32nd', dots: 0 },
  { div: 3, type: '64th', dots: 0 },
];

export function roundToAtomic(div: number): number {
  return Math.max(0, Math.round(div / ATOMIC_DIVISIONS) * ATOMIC_DIVISIONS);
}

/**
 * Greedily decomposes an arbitrary duration (in divisions, must already be a
 * multiple of ATOMIC_DIVISIONS) into a sequence of standard notated note
 * values tied together, since MusicXML notes can't have arbitrary length.
 */
export function decomposeDuration(divisions: number): NoteValue[] {
  let remaining = roundToAtomic(divisions);
  const out: NoteValue[] = [];
  let guard = 0;
  while (remaining > 0 && guard < 64) {
    guard += 1;
    const candidate = NOTE_VALUES.find((v) => v.div <= remaining);
    if (!candidate) break;
    out.push(candidate);
    remaining -= candidate.div;
  }
  return out;
}
