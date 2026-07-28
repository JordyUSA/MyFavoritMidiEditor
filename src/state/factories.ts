import { makeId } from '@/utils/id';
import { nextColor } from '@/utils/color';
import { gmInstrumentName } from '@/utils/gmInstruments';
import type {
  EffectInstance,
  EffectType,
  InstrumentSpec,
  Note,
  Project,
  Track,
  Waveform,
} from './types';

export function createNote(partial: Partial<Note> & Pick<Note, 'pitch' | 'start' | 'duration'>): Note {
  return {
    id: makeId('note'),
    velocity: 100,
    ...partial,
  };
}

export function createInstrument(program = 0, isDrumKit = false): InstrumentSpec {
  return {
    program,
    isDrumKit,
    source: 'synth',
    name: isDrumKit ? 'Standard Drum Kit' : gmInstrumentName(program),
  };
}

const DEFAULT_EFFECT_PARAMS: Record<EffectType, Record<string, number>> = {
  reverb: { decay: 2.5, preDelay: 0.02 },
  delay: { delayTime: 0.25, feedback: 0.3 },
  chorus: { frequency: 1.5, depth: 0.5 },
  distortion: { distortion: 0.3 },
  eq3: { low: 0, mid: 0, high: 0 },
  compressor: { threshold: -24, ratio: 4, attack: 0.02, release: 0.2 },
  phaser: { frequency: 0.5, octaves: 3 },
  bitcrusher: { bits: 8 },
  tremolo: { frequency: 9, depth: 0.6 },
  autoFilter: { frequency: 1, baseFrequency: 200 },
};

export function createEffect(type: EffectType): EffectInstance {
  return {
    id: makeId('fx'),
    type,
    enabled: true,
    wet: 0.5,
    params: { ...DEFAULT_EFFECT_PARAMS[type] },
  };
}

export function createTrack(partial: Partial<Track> = {}): Track {
  const color = partial.color ?? nextColor();
  const instrument = partial.instrument ?? createInstrument(0, false);
  return {
    id: makeId('track'),
    name: partial.name ?? instrument.name,
    instrument,
    color,
    notes: partial.notes ?? [],
    effects: partial.effects ?? [],
    volume: partial.volume ?? 0,
    pan: partial.pan ?? 0,
    muted: partial.muted ?? false,
    solo: partial.solo ?? false,
    viewMode: partial.viewMode ?? 'bars',
    midiChannel: partial.midiChannel ?? 0,
  };
}

export function createWaveform(partial: Partial<Waveform> = {}): Waveform {
  return {
    id: makeId('wave'),
    name: partial.name ?? 'New Waveform',
    color: partial.color ?? nextColor(),
    startOffset: partial.startOffset ?? 0,
    tracks: partial.tracks ?? [],
    collapsed: partial.collapsed ?? false,
    muted: partial.muted ?? false,
    importInfo: partial.importInfo,
  };
}

export function createEmptyProject(name = 'Untitled Project'): Project {
  const now = new Date().toISOString();
  return {
    formatVersion: 1,
    id: makeId('proj'),
    name,
    createdAt: now,
    modifiedAt: now,
    tempoMap: [{ beat: 0, bpm: 120 }],
    timeSignatureMap: [{ beat: 0, numerator: 4, denominator: 4 }],
    masterVolume: 0,
    swing: 0,
    waveforms: [],
  };
}
