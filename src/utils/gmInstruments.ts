/** The 128 General MIDI program names, grouped into the 16 standard GM families. */
export interface GMFamily {
  name: string;
  programStart: number; // inclusive, 0-indexed
  programEnd: number; // inclusive
}

export const GM_FAMILIES: GMFamily[] = [
  { name: 'Piano', programStart: 0, programEnd: 7 },
  { name: 'Chromatic Percussion', programStart: 8, programEnd: 15 },
  { name: 'Organ', programStart: 16, programEnd: 23 },
  { name: 'Guitar', programStart: 24, programEnd: 31 },
  { name: 'Bass', programStart: 32, programEnd: 39 },
  { name: 'Strings', programStart: 40, programEnd: 47 },
  { name: 'Ensemble', programStart: 48, programEnd: 55 },
  { name: 'Brass', programStart: 56, programEnd: 63 },
  { name: 'Reed', programStart: 64, programEnd: 71 },
  { name: 'Pipe', programStart: 72, programEnd: 79 },
  { name: 'Synth Lead', programStart: 80, programEnd: 87 },
  { name: 'Synth Pad', programStart: 88, programEnd: 95 },
  { name: 'Synth Effects', programStart: 96, programEnd: 103 },
  { name: 'Ethnic', programStart: 104, programEnd: 111 },
  { name: 'Percussive', programStart: 112, programEnd: 119 },
  { name: 'Sound Effects', programStart: 120, programEnd: 127 },
];

export const GM_INSTRUMENT_NAMES: string[] = [
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano',
  'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
  'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (jazz)', 'Electric Guitar (clean)',
  'Electric Guitar (muted)', 'Overdriven Guitar', 'Distortion Guitar', 'Guitar Harmonics',
  'Acoustic Bass', 'Electric Bass (finger)', 'Electric Bass (pick)', 'Fretless Bass',
  'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
  'Violin', 'Viola', 'Cello', 'Contrabass', 'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
  'String Ensemble 1', 'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
  'Choir Aahs', 'Voice Oohs', 'Synth Voice', 'Orchestra Hit',
  'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet', 'French Horn', 'Brass Section', 'Synth Brass 1', 'Synth Brass 2',
  'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
  'Piccolo', 'Flute', 'Recorder', 'Pan Flute', 'Blown Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
  'Lead 1 (square)', 'Lead 2 (sawtooth)', 'Lead 3 (calliope)', 'Lead 4 (chiff)',
  'Lead 5 (charang)', 'Lead 6 (voice)', 'Lead 7 (fifths)', 'Lead 8 (bass + lead)',
  'Pad 1 (new age)', 'Pad 2 (warm)', 'Pad 3 (polysynth)', 'Pad 4 (choir)',
  'Pad 5 (bowed)', 'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
  'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)', 'FX 4 (atmosphere)',
  'FX 5 (brightness)', 'FX 6 (goblins)', 'FX 7 (echoes)', 'FX 8 (sci-fi)',
  'Sitar', 'Banjo', 'Shamisen', 'Koto', 'Kalimba', 'Bag pipe', 'Fiddle', 'Shanai',
  'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
  'Guitar Fret Noise', 'Breath Noise', 'Seashore', 'Bird Tweet', 'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot',
];

export const GM_DRUM_PROGRAM = -1; // sentinel: channel-10 percussion kit

export function gmInstrumentName(program: number): string {
  return GM_INSTRUMENT_NAMES[Math.max(0, Math.min(127, program))] ?? 'Unknown';
}

export function gmFamilyForProgram(program: number): GMFamily {
  return (
    GM_FAMILIES.find((f) => program >= f.programStart && program <= f.programEnd) ?? GM_FAMILIES[0]
  );
}

/** GM percussion key map (channel 10), the notes most drum machines / DAWs expose. */
export const GM_DRUM_NOTES: { pitch: number; name: string }[] = [
  { pitch: 35, name: 'Acoustic Bass Drum' },
  { pitch: 36, name: 'Bass Drum 1' },
  { pitch: 37, name: 'Side Stick' },
  { pitch: 38, name: 'Acoustic Snare' },
  { pitch: 39, name: 'Hand Clap' },
  { pitch: 40, name: 'Electric Snare' },
  { pitch: 41, name: 'Low Floor Tom' },
  { pitch: 42, name: 'Closed Hi-Hat' },
  { pitch: 43, name: 'High Floor Tom' },
  { pitch: 44, name: 'Pedal Hi-Hat' },
  { pitch: 45, name: 'Low Tom' },
  { pitch: 46, name: 'Open Hi-Hat' },
  { pitch: 47, name: 'Low-Mid Tom' },
  { pitch: 48, name: 'Hi-Mid Tom' },
  { pitch: 49, name: 'Crash Cymbal 1' },
  { pitch: 50, name: 'High Tom' },
  { pitch: 51, name: 'Ride Cymbal 1' },
  { pitch: 52, name: 'Chinese Cymbal' },
  { pitch: 53, name: 'Ride Bell' },
  { pitch: 54, name: 'Tambourine' },
  { pitch: 55, name: 'Splash Cymbal' },
  { pitch: 56, name: 'Cowbell' },
  { pitch: 57, name: 'Crash Cymbal 2' },
  { pitch: 59, name: 'Ride Cymbal 2' },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  return `${NOTE_NAMES[pitch % 12]}${octave}`;
}
