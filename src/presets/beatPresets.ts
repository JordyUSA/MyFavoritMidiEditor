import { createNote } from '@/state/factories';
import type { Note } from '@/state/types';

export interface BeatHit {
  pitch: number;
  start: number;
  velocity: number;
}

export interface BeatPreset {
  id: string;
  name: string;
  genre: string;
  description: string;
  bpm: number;
  lengthBeats: number; // one loop cycle
  hits: BeatHit[];
}

/**
 * Compact pattern DSL: `"<pitch>:<beat>[@vel],<beat>[@vel],... <pitch>:..."`.
 * e.g. `"36:0,2 38:1,3 42:0,.5,1,1.5,2,2.5,3,3.5"` is a basic rock beat.
 */
function pattern(str: string, defaultVelocity = 100): BeatHit[] {
  const hits: BeatHit[] = [];
  for (const group of str.trim().split(/\s+/)) {
    const [pitchStr, beatsStr] = group.split(':');
    const pitch = Number(pitchStr);
    for (const beatToken of beatsStr.split(',')) {
      const [beatStr, velStr] = beatToken.split('@');
      hits.push({ pitch, start: Number(beatStr), velocity: velStr ? Number(velStr) : defaultVelocity });
    }
  }
  return hits;
}

const KICK = 36;
const SNARE = 38;
const RIM = 37;
const CLAP = 39;
const HAT = 42;
const OPEN_HAT = 46;
const CRASH = 49;
const RIDE = 51;
const LOW_TOM = 41;
const MID_TOM = 45;
const COWBELL = 56;

export const BEAT_PRESETS: BeatPreset[] = [
  {
    id: 'rock-basic',
    name: 'Basic Rock',
    genre: 'Rock',
    description: 'Straight 8th hats, backbeat snare.',
    bpm: 118,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,2 ${SNARE}:1,3 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5`),
  },
  {
    id: 'pop-driving',
    name: 'Driving Pop',
    genre: 'Pop',
    description: 'Syncopated kick, tight hats.',
    bpm: 112,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,1.5,2.5 ${SNARE}:1,3 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5`),
  },
  {
    id: 'boom-bap',
    name: 'Boom Bap',
    genre: 'Hip-Hop',
    description: 'Classic 90s hip-hop swing groove.',
    bpm: 90,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,.75,2.5 ${SNARE}:1,3 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5@70`),
  },
  {
    id: 'trap',
    name: 'Trap',
    genre: 'Hip-Hop',
    description: '16th-note hats with a half-time clap.',
    bpm: 140,
    lengthBeats: 4,
    hits: pattern(
      `${KICK}:0,1.75,2.5 ${CLAP}:2 ${HAT}:0,.25,.5,.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25,3.5,3.75@60`,
    ),
  },
  {
    id: 'house',
    name: 'Four on the Floor',
    genre: 'House',
    description: 'Classic house/four-on-the-floor kick with offbeat open hats.',
    bpm: 124,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,1,2,3 ${CLAP}:1,3 ${OPEN_HAT}:.5,1.5,2.5,3.5`),
  },
  {
    id: 'techno',
    name: 'Driving Techno',
    genre: 'Techno',
    description: 'Relentless four-on-the-floor with 8th-note hats.',
    bpm: 130,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,1,2,3 ${RIM}:1,3 ${HAT}:.5,1.5,2.5,3.5@80`),
  },
  {
    id: 'disco',
    name: 'Disco',
    genre: 'Disco',
    description: 'Four-on-the-floor with open hi-hats on the offbeat.',
    bpm: 118,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,1,2,3 ${SNARE}:1,3 ${OPEN_HAT}:.5,1.5,2.5,3.5`),
  },
  {
    id: 'funk',
    name: 'Funky Drummer',
    genre: 'Funk',
    description: 'Syncopated ghost-note funk groove.',
    bpm: 100,
    lengthBeats: 4,
    hits: pattern(
      `${KICK}:0,.75,2,2.75 ${SNARE}:1,1.75@50,3 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5@70`,
    ),
  },
  {
    id: 'reggae-onedrop',
    name: 'One Drop',
    genre: 'Reggae',
    description: 'Kick and snare together on beat 3, skanking hats.',
    bpm: 80,
    lengthBeats: 4,
    hits: pattern(`${KICK}:2 ${SNARE}:2 ${HAT}:0.5,1.5,2.5,3.5`),
  },
  {
    id: 'jazz-swing',
    name: 'Jazz Swing',
    genre: 'Jazz',
    description: 'Ride cymbal swing pattern with hi-hat on 2 & 4.',
    bpm: 132,
    lengthBeats: 4,
    hits: pattern(`${RIDE}:0,.67,1,2,2.67,3 ${HAT}:1,3@60 ${KICK}:0@40,2@40`),
  },
  {
    id: 'bossa-nova',
    name: 'Bossa Nova',
    genre: 'Latin',
    description: 'Light Brazilian bossa groove.',
    bpm: 118,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,1.5,3 ${RIM}:1,1.75,2.75,3.5@70 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5@50`),
  },
  {
    id: 'blues-shuffle',
    name: 'Blues Shuffle',
    genre: 'Blues',
    description: 'Triplet shuffle feel.',
    bpm: 96,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,2 ${SNARE}:1,3 ${HAT}:0,.67,1,1.67,2,2.67,3,3.67@70`),
  },
  {
    id: 'ballad',
    name: 'Ballad',
    genre: 'Ballad',
    description: 'Sparse, gentle groove for slow songs.',
    bpm: 70,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,2 ${SNARE}:1,3 ${HAT}:0,1,2,3@50`),
  },
  {
    id: 'metal-double-kick',
    name: 'Metal Double Kick',
    genre: 'Metal',
    description: 'Fast alternating double bass with crash on 1.',
    bpm: 160,
    lengthBeats: 4,
    hits: pattern(
      `${KICK}:0,.5,1,1.5,2,2.5,3,3.5 ${SNARE}:1,3 ${CRASH}:0 ${HAT}:1,3`,
    ),
  },
  {
    id: 'dnb',
    name: 'Drum & Bass Break',
    genre: 'Drum & Bass',
    description: 'Fast syncopated breakbeat.',
    bpm: 172,
    lengthBeats: 4,
    hits: pattern(
      `${KICK}:0,2.5 ${SNARE}:1,3 ${HAT}:0,.25,.5,.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25,3.5,3.75@55`,
    ),
  },
  {
    id: 'dubstep-halftime',
    name: 'Dubstep Half-Time',
    genre: 'Dubstep',
    description: 'Half-time snare with sparse kicks.',
    bpm: 140,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,2.5 ${CLAP}:2 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5@60`),
  },
  {
    id: 'afrobeat',
    name: 'Afrobeat',
    genre: 'Afrobeat',
    description: 'Polyrhythmic groove with cowbell.',
    bpm: 112,
    lengthBeats: 4,
    hits: pattern(
      `${KICK}:0,1.25,2.5 ${RIM}:1,2,3.5 ${COWBELL}:0,1,2,3@70 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5@60`,
    ),
  },
  {
    id: 'waltz',
    name: 'Waltz',
    genre: 'Waltz (3/4)',
    description: 'Oom-pah-pah in 3/4 time.',
    bpm: 144,
    lengthBeats: 3,
    hits: pattern(`${KICK}:0 ${SNARE}:1,2@70`),
  },
  {
    id: 'punk',
    name: 'Punk Rock',
    genre: 'Punk',
    description: 'Fast driving 8ths, no frills.',
    bpm: 176,
    lengthBeats: 4,
    hits: pattern(`${KICK}:0,1,2,3 ${SNARE}:1,3 ${HAT}:0,.5,1,1.5,2,2.5,3,3.5`),
  },
  {
    id: 'toms-fill',
    name: 'Tom Fill (1 bar)',
    genre: 'Fill',
    description: 'A descending tom fill — great for turnarounds.',
    bpm: 120,
    lengthBeats: 4,
    hits: pattern(`${MID_TOM}:0,.5 ${LOW_TOM}:1,1.5 ${SNARE}:2,2.5,3,3.5 ${CRASH}:0@60`),
  },
];

export function instantiateBeatPreset(preset: BeatPreset, startBeat: number, repeats: number): Note[] {
  const notes: Note[] = [];
  for (let r = 0; r < repeats; r++) {
    const base = startBeat + r * preset.lengthBeats;
    for (const hit of preset.hits) {
      notes.push(
        createNote({
          pitch: hit.pitch,
          start: base + hit.start,
          duration: 0.2,
          velocity: hit.velocity,
        }),
      );
    }
  }
  return notes;
}
