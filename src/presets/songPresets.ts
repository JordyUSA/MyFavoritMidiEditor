import { createNote } from '@/state/factories';
import type { Note } from '@/state/types';
import { romanToTriad, keyRootMidi, type ScaleMode } from './theory';

export interface ChordStep {
  roman: string;
  bars: number;
}

export interface SongPreset {
  id: string;
  name: string;
  description: string;
  key: string;
  mode: ScaleMode;
  bpm: number;
  beatsPerBar: number;
  loopCount: number;
  chords: ChordStep[];
  suggestedBeatPresetId?: string;
}

export const SONG_PRESETS: SongPreset[] = [
  {
    id: 'pop-1564',
    name: 'Pop Progression',
    description: 'I – V – vi – IV, the backbone of countless pop hits.',
    key: 'C',
    mode: 'major',
    bpm: 112,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'I', bars: 1 },
      { roman: 'V', bars: 1 },
      { roman: 'vi', bars: 1 },
      { roman: 'IV', bars: 1 },
    ],
    suggestedBeatPresetId: 'pop-driving',
  },
  {
    id: 'fifties',
    name: "'50s Progression",
    description: 'I – vi – IV – V, the doo-wop classic.',
    key: 'C',
    mode: 'major',
    bpm: 96,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'I', bars: 1 },
      { roman: 'vi', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'V', bars: 1 },
    ],
    suggestedBeatPresetId: 'ballad',
  },
  {
    id: 'blues-12bar',
    name: '12-Bar Blues',
    description: 'The quick-change blues form.',
    key: 'C',
    mode: 'major',
    bpm: 100,
    beatsPerBar: 4,
    loopCount: 1,
    chords: [
      { roman: 'I', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'I', bars: 1 },
      { roman: 'I', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'I', bars: 1 },
      { roman: 'I', bars: 1 },
      { roman: 'V', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'I', bars: 1 },
      { roman: 'V', bars: 1 },
    ],
    suggestedBeatPresetId: 'blues-shuffle',
  },
  {
    id: 'jazz-251',
    name: 'Jazz ii–V–I',
    description: 'The most common jazz cadence, looped.',
    key: 'C',
    mode: 'major',
    bpm: 120,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'ii', bars: 1 },
      { roman: 'V', bars: 1 },
      { roman: 'I', bars: 2 },
    ],
    suggestedBeatPresetId: 'jazz-swing',
  },
  {
    id: 'andalusian',
    name: 'Andalusian Cadence',
    description: 'i – VII – VI – V, a dramatic descending minor cadence.',
    key: 'A',
    mode: 'minor',
    bpm: 100,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'i', bars: 1 },
      { roman: 'VII', bars: 1 },
      { roman: 'VI', bars: 1 },
      { roman: 'V', bars: 1 },
    ],
  },
  {
    id: 'sad-minor',
    name: 'Sad Minor',
    description: 'i – VI – III – VII, an emotional minor-key loop.',
    key: 'A',
    mode: 'minor',
    bpm: 84,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'i', bars: 1 },
      { roman: 'VI', bars: 1 },
      { roman: 'III', bars: 1 },
      { roman: 'VII', bars: 1 },
    ],
  },
  {
    id: 'canon',
    name: 'Canon Progression',
    description: 'I – V – vi – iii – IV – I – IV – V, made famous by Pachelbel.',
    key: 'C',
    mode: 'major',
    bpm: 90,
    beatsPerBar: 4,
    loopCount: 1,
    chords: [
      { roman: 'I', bars: 1 },
      { roman: 'V', bars: 1 },
      { roman: 'vi', bars: 1 },
      { roman: 'iii', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'I', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'V', bars: 1 },
    ],
  },
  {
    id: 'power-rock',
    name: 'Rock Anthem',
    description: 'I – IV – V – IV, a driving rock staple.',
    key: 'C',
    mode: 'major',
    bpm: 130,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'I', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'V', bars: 1 },
      { roman: 'IV', bars: 1 },
    ],
    suggestedBeatPresetId: 'rock-basic',
  },
  {
    id: 'borrowed-ballad',
    name: 'Borrowed-Chord Ballad',
    description: 'I – IV – iv – I, the minor iv gives a bittersweet turn.',
    key: 'C',
    mode: 'major',
    bpm: 76,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'I', bars: 1 },
      { roman: 'IV', bars: 1 },
      { roman: 'iv', bars: 1 },
      { roman: 'I', bars: 1 },
    ],
    suggestedBeatPresetId: 'ballad',
  },
  {
    id: 'circle-fifths',
    name: 'Circle of Fifths',
    description: 'vi – ii – V – I, walking the circle home.',
    key: 'C',
    mode: 'major',
    bpm: 108,
    beatsPerBar: 4,
    loopCount: 2,
    chords: [
      { roman: 'vi', bars: 1 },
      { roman: 'ii', bars: 1 },
      { roman: 'V', bars: 1 },
      { roman: 'I', bars: 1 },
    ],
  },
];

export interface InstantiatedSong {
  chordNotes: Note[];
  bassNotes: Note[];
  lengthBeats: number;
}

export function instantiateSongPreset(preset: SongPreset, startBeat: number, octave = 4): InstantiatedSong {
  const root = keyRootMidi(preset.key, octave);
  const chordNotes: Note[] = [];
  const bassNotes: Note[] = [];
  let cursor = startBeat;
  const loopLengthBeats = preset.chords.reduce((sum, c) => sum + c.bars * preset.beatsPerBar, 0);

  for (let loop = 0; loop < preset.loopCount; loop++) {
    for (const step of preset.chords) {
      const durationBeats = step.bars * preset.beatsPerBar;
      const triad = romanToTriad(step.roman, root, preset.mode);
      for (const pitch of triad) {
        chordNotes.push(createNote({ pitch, start: cursor, duration: durationBeats - 0.02, velocity: 88 }));
      }
      bassNotes.push(createNote({ pitch: triad[0] - 12, start: cursor, duration: durationBeats - 0.02, velocity: 96 }));
      cursor += durationBeats;
    }
  }

  return { chordNotes, bassNotes, lengthBeats: loopLengthBeats * preset.loopCount };
}
