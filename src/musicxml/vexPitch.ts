const STEP_LOWER = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];
const SHARP = [false, true, false, true, false, false, true, false, true, false, true, false];

/** MIDI pitch -> VexFlow key string, e.g. 60 -> "c/4", 61 -> "c#/4". */
export function midiToVexKey(pitch: number): string {
  const pc = ((pitch % 12) + 12) % 12;
  const octave = Math.floor(pitch / 12) - 1;
  return `${STEP_LOWER[pc]}${SHARP[pc] ? '#' : ''}/${octave}`;
}
