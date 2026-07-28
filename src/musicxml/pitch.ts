/** Sharps-only pitch spelling: MIDI number -> MusicXML <pitch>. Good enough without full key-aware spelling. */
const STEP_BY_PC = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
const ALTER_BY_PC = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

export interface XmlPitch {
  step: string;
  alter: number;
  octave: number;
}

export function midiToXmlPitch(midiNumber: number): XmlPitch {
  const pc = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  return { step: STEP_BY_PC[pc], alter: ALTER_BY_PC[pc], octave };
}
